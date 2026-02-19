import { ContainerBuilder, MessageFlags, TextChannel, time, TimestampStyles } from "discord.js";
import * as log from "@std/log";
import { GlobalClient } from "../GlobalClient.ts";
import { TopicsRepository } from "../database/repository/TopicsRepository.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { EventReminderSetupsRepository } from "../database/repository/EventReminderSetupsRepository.ts";
import { NewsQueueRepository } from "../database/repository/NewsQueueRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import { NewNewsQueueJob, TopicData } from "../database/schema/lodestone-news.ts";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export class LiveLetterAnnouncementService {
  public static async checkAndSendAnnouncements(): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;

    const unannouncedLiveLetters = await TopicsRepository.getUnannouncedLiveLetters();
    if (unannouncedLiveLetters.length === 0) return;

    const now = Date.now();

    for (const topic of unannouncedLiveLetters) {
      if (!topic.timestampLiveLetter) continue;

      const diffMs = topic.timestampLiveLetter.getTime() - now;
      if (diffMs > 0 || diffMs < -TWO_HOURS_MS) continue;

      await this.enqueueAnnouncementJobs(topic);
      await TopicsRepository.markLiveLetterAsAnnounced(topic.id);
      log.info(`[LIVE LETTER] Enqueued announcement jobs for: ${topic.title}`);
    }
  }

  private static async enqueueAnnouncementJobs(topic: TopicData): Promise<void> {
    if (!topic.timestampLiveLetter) return;

    const setups = await SetupsRepository.getAllByType("topics");
    if (setups.length === 0) return;

    const guildIds = [...new Set(setups.map((s) => s.guildId))];
    const jobs: NewNewsQueueJob[] = [];

    for (const guildId of guildIds) {
      const reminderSetup = await EventReminderSetupsRepository.get(guildId);

      if (reminderSetup && reminderSetup.enabled === 0) continue;

      let channelId: string | null = null;

      if (reminderSetup?.channelId) {
        channelId = reminderSetup.channelId;
      } else {
        channelId = await SetupsRepository.getChannelId(guildId, "topics");
      }

      if (!channelId) continue;

      jobs.push({
        jobType: "SEND_LIVE_LETTER_ANNOUNCEMENT",
        newsType: "topics",
        newsId: topic.id,
        guildId,
        channelId,
        messageId: null,
        status: "PENDING",
        retryCount: 0,
        priority: 1,
        payload: {
          title: topic.title,
          link: topic.link,
          date: topic.date.getTime(),
          banner: topic.banner,
          description: {
            html: "",
            markdown: topic.description,
          },
        },
        errorMessage: null,
      });
    }

    if (jobs.length === 0) return;

    await NewsQueueRepository.addMany(jobs);
    log.info(`[LIVE LETTER] Enqueued ${jobs.length} announcement jobs for topic ID ${topic.id}`);
  }

  public static buildAnnouncementComponents(topic: TopicData): ContainerBuilder[] | null {
    if (!topic.timestampLiveLetter) return null;

    const timestampFull = time(topic.timestampLiveLetter, TimestampStyles.LongDateTime);
    const timestampRelative = time(topic.timestampLiveLetter, TimestampStyles.RelativeTime);

    const header = DiscordEmbedService.buildTextContainer(
      `# This Live Letter is now live!\nIt started at ${timestampFull} (${timestampRelative})`,
      "COLOR_TOPICS",
    );

    const topicContainer = DiscordEmbedService.getTopicContainerFromData(topic);

    return [header, topicContainer];
  }

  public static async processSendAnnouncementJob(job: {
    newsId: number;
    guildId: string;
    channelId: string;
  }): Promise<void> {
    const client = GlobalClient.client;
    if (!client) throw new Error("Discord client is not available");

    const topic = await TopicsRepository.findById(job.newsId);
    if (!topic) throw new Error(`Topic ${job.newsId} not found`);

    const guild = await client.guilds.fetch(job.guildId);
    if (!guild) throw new Error(`Guild ${job.guildId} not found`);

    const channel = await guild.channels.fetch(job.channelId);
    if (!channel) throw new Error(`Channel ${job.channelId} not found in guild ${job.guildId}`);

    const components = this.buildAnnouncementComponents(topic);
    if (!components) throw new Error(`Could not build announcement components for topic ${job.newsId}`);

    await (channel as TextChannel).send({ components, flags: MessageFlags.IsComponentsV2 });
  }
}
