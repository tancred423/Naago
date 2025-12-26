import moment from "moment";
import { TextChannel, time, TimestampStyles } from "discord.js";
import { Topic } from "../naagostone/type/Topic.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { TopicsRepository } from "../database/repository/TopicsRepository.ts";
import { GlobalClient } from "../GlobalClient.ts";
import * as log from "@std/log";
import { Setup } from "../database/schema/setups.ts";
import { TopicData } from "../database/schema/lodestone-news.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";
import { ComponentsV2Service } from "./ComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";
const maxNewsSent = parseInt(Deno.env.get("MAX_NEWS_SENT")!, 10);

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

    latestTopics.reverse();

    let newCount = 0;
    const itemsWithExisting: Array<{ topic: Topic; existing: TopicData | null }> = [];

    for (const topic of latestTopics) {
      if (!topic) continue;

      const date = moment(topic.date).tz("Europe/London").toDate();
      const existingTopic = await TopicsRepository.find(topic.title, date);

      itemsWithExisting.push({ topic, existing: existingTopic });

      if (!existingTopic) {
        newCount++;
      }
    }

    const shouldSend = newCount <= maxNewsSent;

    for (const { topic, existing: existingTopic } of itemsWithExisting) {
      if (existingTopic) {
        await this.checkForUpdates(existingTopic, topic);
        continue;
      }

      const newsId = saveLodestoneNews ? await TopicsRepository.add(topic) : undefined;
      if (sendLodestoneNews && shouldSend) {
        await ComponentsV2Service.send("topics", {
          title: topic.title,
          link: topic.link,
          date: topic.date,
          banner: topic.banner,
          description: topic.description,
        }, newsId);
      }
    }

    return newCount;
  }

  private static async checkForUpdates(existing: TopicData, topic: Topic): Promise<void> {
    const { descriptionChanged: _descriptionChanged, descriptionV2Changed } = TopicsRepository.hasDescriptionChanged(
      existing,
      topic,
    );

    if (!descriptionV2Changed) return;

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
    );

    if (updated > 0 || failed > 0) {
      log.info(`[TOPICS] Updated ${updated} messages, ${failed} failed for topic: ${topic.title}`);
    }
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
