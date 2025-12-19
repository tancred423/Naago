import moment from "moment";
import { TextChannel } from "discord.js";
import { StringManipulationService } from "./StringManipulationService.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Maintenance } from "../naagostone/type/Maintenance.ts";
import { MaintenancesRepository } from "../database/repository/MaintenancesRepository.ts";
import { PostedNewsMessagesRepository } from "../database/repository/PostedNewsMessagesRepository.ts";
import { GlobalClient } from "../index.ts";
import { Setup } from "../database/schema/setups.ts";
import { MaintenanceData } from "../database/schema/lodestone-news.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import { BetaComponentsV2Service } from "./BetaComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";
import * as log from "@std/log";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";

export class MaintenanceSenderService {
  public static async checkForNew(): Promise<number> {
    let latestMaintenances: Maintenance[];
    try {
      latestMaintenances = await NaagostoneApiService.fetchLatest10Maintenances();
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.error(`[MAINTENANCES] Fetching latest maintenances was NOT successful: ${error.message}`);
      }
      return 0;
    }

    let newCount = 0;

    for (const maintenance of latestMaintenances.reverse()) {
      if (!maintenance) continue;

      maintenance.tag = maintenance.tag === "[Maintenance]" ? null : maintenance.tag;
      maintenance.tag = StringManipulationService.convertTag("maintenance", maintenance.tag ?? null);

      const date = moment(maintenance.date).tz("Europe/London").toDate();
      const existingMaintenance = await MaintenancesRepository.find(maintenance.title, date);

      if (existingMaintenance) {
        await this.checkForUpdates(existingMaintenance, maintenance);
        continue;
      }

      if (saveLodestoneNews) {
        const newsId = await MaintenancesRepository.add(maintenance);
        if (sendLodestoneNews) await this.send(maintenance, newsId);
      } else if (sendLodestoneNews) {
        await this.send(maintenance);
      }
      newCount++;
    }

    return newCount;
  }

  private static async checkForUpdates(existing: MaintenanceData, maintenance: Maintenance): Promise<void> {
    const { descriptionChanged, descriptionV2Changed } = MaintenancesRepository.hasDescriptionChanged(
      existing,
      maintenance,
    );

    if (!descriptionChanged && !descriptionV2Changed) return;

    if (saveLodestoneNews) {
      await MaintenancesRepository.updateDescriptions(
        existing.id,
        maintenance.description.markdown,
        maintenance.description.discord_components_v2 ?? null,
      );
    }

    if (!sendLodestoneNews) return;

    const { updated, failed } = await NewsMessageUpdateService.updatePostedMessages(
      "maintenances",
      existing.id,
      {
        title: maintenance.title,
        link: maintenance.link,
        date: maintenance.date,
        tag: maintenance.tag,
        description: maintenance.description,
      },
      () => DiscordEmbedService.getMaintenanceEmbed(maintenance),
      descriptionChanged,
      descriptionV2Changed,
    );

    if (updated > 0 || failed > 0) {
      log.info(`[MAINTENANCES] Updated ${updated} messages, ${failed} failed for maintenance: ${maintenance.title}`);
    }
  }

  private static async send(maintenance: Maintenance, newsId?: number): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    const setups: Setup[] = await SetupsRepository.getAllByType("maintenances");

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        const embed = DiscordEmbedService.getMaintenanceEmbed(maintenance);
        const message = await (channel as TextChannel).send({ embeds: [embed] });

        if (newsId !== undefined) {
          await PostedNewsMessagesRepository.add(
            "maintenances",
            newsId,
            setup.guildId,
            setup.channelId,
            message.id,
            false,
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(`[MAINTENANCES] Sending maintenance to ${setup.guildId} was NOT successful: ${error.message}`);
        }
        continue;
      }
    }

    await BetaComponentsV2Service.sendToBetaChannel("maintenances", {
      title: maintenance.title,
      link: maintenance.link,
      date: maintenance.date,
      tag: maintenance.tag,
      description: maintenance.description,
    }, newsId);
  }
}
