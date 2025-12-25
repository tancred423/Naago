import moment from "moment";
import { TextChannel } from "discord.js";
import { StringManipulationService } from "./StringManipulationService.ts";
import { NoticesRepository } from "../database/repository/NoticesRepository.ts";
import { PostedNewsMessagesRepository } from "../database/repository/PostedNewsMessagesRepository.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Notice } from "../naagostone/type/Notice.ts";
import { GlobalClient } from "../index.ts";
import { Setup } from "../database/schema/setups.ts";
import { NoticeData } from "../database/schema/lodestone-news.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";
import { BetaComponentsV2Service } from "./BetaComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";
import * as log from "@std/log";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";
const maxNewsSent = parseInt(Deno.env.get("MAX_NEWS_SENT")!, 10);

export class NoticeSenderService {
  public static async checkForNew(): Promise<number> {
    let latestNotices: Notice[];
    try {
      latestNotices = await NaagostoneApiService.fetchLatest10Notices();
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        log.error(`[NOTICES] Lodestone service is unavailable: ${error.message}`);
      } else if (error instanceof Error) {
        log.error(`[NOTICES] Fetching latest notices was NOT successful: ${error.message}`);
      }
      return 0;
    }

    latestNotices.reverse();

    let newCount = 0;
    const itemsWithExisting: Array<{ notice: Notice; existing: NoticeData | null }> = [];

    for (const notice of latestNotices) {
      if (!notice) continue;

      notice.tag = StringManipulationService.convertTag("notice", notice.tag);

      const date = moment(notice.date).tz("Europe/London").toDate();
      const existingNotice = await NoticesRepository.find(notice.title, date);

      itemsWithExisting.push({ notice, existing: existingNotice });

      if (!existingNotice) {
        newCount++;
      }
    }

    const shouldSend = newCount <= maxNewsSent;

    for (const { notice, existing: existingNotice } of itemsWithExisting) {
      if (existingNotice) {
        await this.checkForUpdates(existingNotice, notice);
        continue;
      }

      if (saveLodestoneNews) {
        const newsId = await NoticesRepository.add(notice);
        if (sendLodestoneNews && shouldSend) await this.send(notice, newsId);
      } else if (sendLodestoneNews && shouldSend) {
        await this.send(notice);
      }
    }

    return newCount;
  }

  private static async checkForUpdates(existing: NoticeData, notice: Notice): Promise<void> {
    const { descriptionChanged, descriptionV2Changed } = NoticesRepository.hasDescriptionChanged(existing, notice);

    if (!descriptionChanged && !descriptionV2Changed) return;

    if (saveLodestoneNews) {
      await NoticesRepository.updateDescriptions(
        existing.id,
        notice.description.markdown,
        notice.description.discord_components_v2 ?? null,
      );
    }

    if (!sendLodestoneNews) return;

    const { updated, failed } = await NewsMessageUpdateService.updatePostedMessages(
      "notices",
      existing.id,
      {
        title: notice.title,
        link: notice.link,
        date: notice.date,
        tag: notice.tag,
        description: notice.description,
      },
      () => DiscordEmbedService.getNoticesEmbed(notice),
      descriptionChanged,
      descriptionV2Changed,
    );

    if (updated > 0 || failed > 0) {
      log.info(`[NOTICES] Updated ${updated} messages, ${failed} failed for notice: ${notice.title}`);
    }
  }

  public static async send(notice: Notice, newsId?: number): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    const setups: Setup[] = await SetupsRepository.getAllByType("notices");

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        const embed = DiscordEmbedService.getNoticesEmbed(notice);
        const message = await (channel as TextChannel).send({ embeds: [embed] });

        if (newsId !== undefined) {
          await PostedNewsMessagesRepository.add(
            "notices",
            newsId,
            setup.guildId,
            setup.channelId,
            message.id,
            false,
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(`[NOTICES] Sending notice to ${setup.guildId} was NOT successful: ${error.message}`);
        }
        continue;
      }
    }

    await BetaComponentsV2Service.sendToBetaChannel("notices", {
      title: notice.title,
      link: notice.link,
      date: notice.date,
      tag: notice.tag,
      description: notice.description,
    }, newsId);
  }
}
