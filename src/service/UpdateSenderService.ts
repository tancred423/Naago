import moment from "moment";
import { TextChannel } from "discord.js";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Update } from "../naagostone/type/Updates.ts";
import { UpdatesRepository } from "../database/repository/UpdatesRepository.ts";
import { PostedNewsMessagesRepository } from "../database/repository/PostedNewsMessagesRepository.ts";
import { GlobalClient } from "../index.ts";
import { Setup } from "../database/schema/setups.ts";
import { UpdateData } from "../database/schema/lodestone-news.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";
import { BetaComponentsV2Service } from "./BetaComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";
import * as log from "@std/log";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";
const maxNewsSent = parseInt(Deno.env.get("MAX_NEWS_SENT")!, 10);

export class UpdateSenderService {
  public static async checkForNew(): Promise<number> {
    let latestUpdates: Update[];
    try {
      latestUpdates = await NaagostoneApiService.fetchLatest10Updates();
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        log.error(`[UPDATES] Lodestone service is unavailable: ${error.message}`);
      } else if (error instanceof Error) {
        log.error(`[UPDATES] Fetching latest updates was NOT successful: ${error.message}`);
      }
      return 0;
    }

    latestUpdates.reverse();

    let newCount = 0;
    const itemsWithExisting: Array<{ update: Update; existing: UpdateData | null }> = [];

    for (const update of latestUpdates) {
      if (!update) continue;

      const date = moment(update.date).tz("Europe/London").toDate();
      const existingUpdate = await UpdatesRepository.find(update.title, date);

      itemsWithExisting.push({ update, existing: existingUpdate });

      if (!existingUpdate) {
        newCount++;
      }
    }

    const shouldSend = newCount <= maxNewsSent;

    for (const { update, existing: existingUpdate } of itemsWithExisting) {
      if (existingUpdate) {
        await this.checkForUpdates(existingUpdate, update);
        continue;
      }

      if (saveLodestoneNews) {
        const newsId = await UpdatesRepository.add(update);
        if (sendLodestoneNews && shouldSend) await this.send(update, newsId);
      } else if (sendLodestoneNews && shouldSend) {
        await this.send(update);
      }
    }

    return newCount;
  }

  private static async checkForUpdates(existing: UpdateData, update: Update): Promise<void> {
    const { descriptionChanged, descriptionV2Changed } = UpdatesRepository.hasDescriptionChanged(existing, update);

    if (!descriptionChanged && !descriptionV2Changed) return;

    if (saveLodestoneNews) {
      await UpdatesRepository.updateDescriptions(
        existing.id,
        update.description.markdown,
        update.description.discord_components_v2 ?? null,
      );
    }

    if (!sendLodestoneNews) return;

    const { updated, failed } = await NewsMessageUpdateService.updatePostedMessages(
      "updates",
      existing.id,
      {
        title: update.title,
        link: update.link,
        date: update.date,
        description: update.description,
      },
      () => DiscordEmbedService.getUpdatesEmbed(update),
      descriptionChanged,
      descriptionV2Changed,
    );

    if (updated > 0 || failed > 0) {
      log.info(`[UPDATES] Updated ${updated} messages, ${failed} failed for update: ${update.title}`);
    }
  }

  public static async send(update: Update, newsId?: number): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    const setups: Setup[] = await SetupsRepository.getAllByType("updates");

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        const embed = DiscordEmbedService.getUpdatesEmbed(update);
        const message = await (channel as TextChannel).send({ embeds: [embed] });

        if (newsId !== undefined) {
          await PostedNewsMessagesRepository.add(
            "updates",
            newsId,
            setup.guildId,
            setup.channelId,
            message.id,
            false,
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(`[UPDATES] Sending update to ${setup.guildId} was NOT successful: ${error.message}`);
        }
        continue;
      }
    }

    await BetaComponentsV2Service.sendToBetaChannel("updates", {
      title: update.title,
      link: update.link,
      date: update.date,
      description: update.description,
    }, newsId);
  }
}
