import moment from "moment";
import { TextChannel } from "discord.js";
import { StringManipulationService } from "./StringManipulationService.ts";
import * as log from "@std/log";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Status } from "../naagostone/type/Status.ts";
import { StatusesRepository } from "../database/repository/StatusesRepository.ts";
import { PostedNewsMessagesRepository } from "../database/repository/PostedNewsMessagesRepository.ts";
import { GlobalClient } from "../index.ts";
import { Setup } from "../database/schema/setups.ts";
import { StatusData } from "../database/schema/lodestone-news.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";
import { BetaComponentsV2Service } from "./BetaComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";

export default class StatusSenderService {
  public static async checkForNew(): Promise<number> {
    let latestStatuses: Status[];
    try {
      latestStatuses = await NaagostoneApiService.fetchLatest10Statuses();
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        log.error(`[STATUS] Lodestone service is unavailable: ${error.message}`);
      } else if (error instanceof Error) {
        log.error(`[STATUS] Fetching latest statuses was NOT successful: ${error.message}`);
      }
      return 0;
    }

    let newCount = 0;

    for (const status of latestStatuses.reverse()) {
      if (!status) continue;

      status.tag = StringManipulationService.convertTag("status", status.tag);

      const date = moment(status.date).tz("Europe/London").toDate();
      const existingStatus = await StatusesRepository.find(status.title, date);

      if (existingStatus) {
        await this.checkForUpdates(existingStatus, status);
        continue;
      }

      if (saveLodestoneNews) {
        const newsId = await StatusesRepository.add(status);
        if (sendLodestoneNews) await this.send(status, newsId);
      } else if (sendLodestoneNews) {
        await this.send(status);
      }
      newCount++;
    }

    return newCount;
  }

  private static async checkForUpdates(existing: StatusData, status: Status): Promise<void> {
    const { descriptionChanged, descriptionV2Changed } = StatusesRepository.hasDescriptionChanged(existing, status);

    if (!descriptionChanged && !descriptionV2Changed) return;

    if (saveLodestoneNews) {
      await StatusesRepository.updateDescriptions(
        existing.id,
        status.description.markdown,
        status.description.discord_components_v2 ?? null,
      );
    }

    if (!sendLodestoneNews) return;

    const { updated, failed } = await NewsMessageUpdateService.updatePostedMessages(
      "statuses",
      existing.id,
      {
        title: status.title,
        link: status.link,
        date: status.date,
        tag: status.tag,
        description: status.description,
      },
      () => DiscordEmbedService.getStatusEmbed(status),
      descriptionChanged,
      descriptionV2Changed,
    );

    if (updated > 0 || failed > 0) {
      log.info(`[STATUS] Updated ${updated} messages, ${failed} failed for status: ${status.title}`);
    }
  }

  public static async send(status: Status, newsId?: number): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    const setups: Setup[] = await SetupsRepository.getAllByType("statuses");

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        const embed = DiscordEmbedService.getStatusEmbed(status);
        const message = await (channel as TextChannel).send({ embeds: [embed] });

        if (newsId !== undefined) {
          await PostedNewsMessagesRepository.add(
            "statuses",
            newsId,
            setup.guildId,
            setup.channelId,
            message.id,
            false,
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(`[STATUS] Sending status to ${setup.guildId} was NOT successful: ${error.message}`);
        }
        continue;
      }
    }

    await BetaComponentsV2Service.sendToBetaChannel("statuses", {
      title: status.title,
      link: status.link,
      date: status.date,
      tag: status.tag,
      description: status.description,
    }, newsId);
  }
}
