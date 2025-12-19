import moment from "moment";
import { TextChannel, time, TimestampStyles } from "discord.js";
import { Topic } from "../naagostone/type/Topic.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { TopicsRepository } from "../database/repository/TopicsRepository.ts";
import { PostedNewsMessagesRepository } from "../database/repository/PostedNewsMessagesRepository.ts";
import { GlobalClient } from "../index.ts";
import * as log from "@std/log";
import { Setup } from "../database/schema/setups.ts";
import { TopicData } from "../database/schema/lodestone-news.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";
import { BetaComponentsV2Service } from "./BetaComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";

export class TopicSenderService {
  public static async checkForNew(): Promise<number> {
    let latestTopics: Topic[];
    try {
      latestTopics = await NaagostoneApiService.fetchLatest10Topics();
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        log.error(`[TOPICS] Lodestone service is unavailable: ${error.message}`);
      } else if (error instanceof Error) {
        log.error(`[TOPICS] Fetching latest topics was NOT successful: ${error.message}`);
      }
      return 0;
    }

    let newCount = 0;

    for (const topic of latestTopics.reverse()) {
      if (!topic) continue;

      const date = moment(topic.date).tz("Europe/London").toDate();
      const existingTopic = await TopicsRepository.find(topic.title, date);

      if (existingTopic) {
        await this.checkForUpdates(existingTopic, topic);
        continue;
      }

      if (saveLodestoneNews) {
        const newsId = await TopicsRepository.add(topic);
        if (sendLodestoneNews) await this.send(topic, newsId);
      } else if (sendLodestoneNews) {
        await this.send(topic);
      }
      newCount++;
    }

    return newCount;
  }

  private static async checkForUpdates(existing: TopicData, topic: Topic): Promise<void> {
    const { descriptionChanged, descriptionV2Changed } = TopicsRepository.hasDescriptionChanged(existing, topic);

    if (!descriptionChanged && !descriptionV2Changed) return;

    if (saveLodestoneNews) {
      await TopicsRepository.updateDescriptions(
        existing.id,
        topic.description.markdown,
        topic.description.discord_components_v2 ?? null,
      );
    }

    if (!sendLodestoneNews) return;

    const { updated, failed } = await NewsMessageUpdateService.updatePostedMessages(
      "topics",
      existing.id,
      {
        title: topic.title,
        link: topic.link,
        date: topic.date,
        banner: topic.banner,
        description: topic.description,
      },
      () => DiscordEmbedService.getTopicEmbed(topic),
      descriptionChanged,
      descriptionV2Changed,
    );

    if (updated > 0 || failed > 0) {
      log.info(`[TOPICS] Updated ${updated} messages, ${failed} failed for topic: ${topic.title}`);
    }
  }

  public static async send(topic: Topic, newsId?: number): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    const setups: Setup[] = await SetupsRepository.getAllByType("topics");

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        const embed = DiscordEmbedService.getTopicEmbed(topic);
        const message = await (channel as TextChannel).send({ embeds: [embed] });

        if (newsId !== undefined) {
          await PostedNewsMessagesRepository.add(
            "topics",
            newsId,
            setup.guildId,
            setup.channelId,
            message.id,
            false,
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(`[TOPICS] Sending topic to ${setup.guildId} was NOT successful: ${error.stack}`);
        }
        continue;
      }
    }

    await BetaComponentsV2Service.sendToBetaChannel("topics", {
      title: topic.title,
      link: topic.link,
      date: topic.date,
      banner: topic.banner,
      description: topic.description,
    }, newsId);
  }

  public static async sendLiveLetterStartedAnnouncement(topic: TopicData): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    if (!topic.timestampLiveLetter) return;

    const setups: Setup[] = await SetupsRepository.getAllByType("topics");
    if (!setups || setups?.length < 1) return;

    const timestampFull = time(topic.timestampLiveLetter, TimestampStyles.LongDateTime);
    const timestampRelative = time(topic.timestampLiveLetter, TimestampStyles.RelativeTime);
    const content = `# This Live Letter is now live!\nIt started at ${timestampFull} (${timestampRelative})`;
    const embed = DiscordEmbedService.getTopicEmbedFromData(topic);

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        await (channel as TextChannel).send({ content, embeds: [embed] });
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(`[LIVE LETTER] Sending announcement to ${setup.guildId} was NOT successful: ${error.stack}`);
        }
        continue;
      }
    }
  }
}
