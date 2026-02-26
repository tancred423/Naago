import { ContainerBuilder, MessageFlags, TextChannel, time, TimestampStyles } from "discord.js";
import * as log from "@std/log";
import { GlobalClient } from "../GlobalClient.ts";
import { TopicsRepository } from "../database/repository/TopicsRepository.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { EventReminderSetupsRepository } from "../database/repository/EventReminderSetupsRepository.ts";
import { NewsQueueRepository } from "../database/repository/NewsQueueRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import { NewNewsQueueJob, TopicData } from "../database/schema/lodestone-news.ts";
import { CommandMentionService } from "./CommandMentionService.ts";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export class EventReminderService {
  public static async checkAndSendReminders(): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;

    const events = await TopicsRepository.getEventsEndingSoon(TWENTY_FOUR_HOURS_MS);
    if (events.length === 0) return;

    const topicSetups = await SetupsRepository.getAllByType("topics");
    if (topicSetups.length === 0) return;

    const guildIds = [...new Set(topicSetups.map((s) => s.guildId))];

    for (const event of events) {
      await this.enqueueReminderJobs(event, guildIds);
      await TopicsRepository.markEventReminderSent(event.id);
      log.info(`[EVENT REMINDER] Enqueued reminder jobs for event: ${event.title}`);
    }
  }

  private static async enqueueReminderJobs(event: TopicData, guildIds: string[]): Promise<void> {
    const effectiveTo = event.eventToOverride ?? event.eventTo;
    if (!effectiveTo) return;

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
        jobType: "SEND_REMINDER",
        newsType: "topics",
        newsId: event.id,
        guildId,
        channelId,
        messageId: null,
        status: "PENDING",
        retryCount: 0,
        priority: 0,
        payload: {
          title: event.title,
          link: event.link,
          date: event.date.getTime(),
          banner: event.banner,
          description: {
            html: "",
            markdown: event.description,
          },
        },
        errorMessage: null,
      });
    }

    if (jobs.length === 0) return;

    await NewsQueueRepository.addMany(jobs);
    log.info(`[EVENT REMINDER] Enqueued ${jobs.length} reminder jobs for event ID ${event.id}`);
  }

  public static buildReminderComponents(event: TopicData): ContainerBuilder[] | null {
    const effectiveTo = event.eventToOverride ?? event.eventTo;
    if (!effectiveTo) return null;

    const timestampFull = time(effectiveTo, TimestampStyles.LongDateTime);
    const timestampRelative = time(effectiveTo, TimestampStyles.RelativeTime);

    const header = DiscordEmbedService.buildTextContainer(
      `# Reminder: This event ends soon\n` +
        `This event ends at ${timestampFull} (${timestampRelative})\n` +
        `You can view all ongoing and upcoming events with ${CommandMentionService.mentionOrBacktick("events")}.\n\n` +
        `-# To disable or change the channel of these reminders, use ${
          CommandMentionService.mentionOrBacktick("setup", "event-reminders")
        }.`,
      "COLOR_TOPICS",
    );

    const topic = DiscordEmbedService.getTopicContainerFromData(event);

    return [header, topic];
  }

  public static async processSendReminderJob(job: {
    newsId: number;
    guildId: string;
    channelId: string;
  }): Promise<void> {
    const client = GlobalClient.client;
    if (!client) throw new Error("Discord client is not available");

    const event = await TopicsRepository.findById(job.newsId);
    if (!event) throw new Error(`Topic ${job.newsId} not found`);

    const guild = await client.guilds.fetch(job.guildId);
    if (!guild) throw new Error(`Guild ${job.guildId} not found`);

    const channel = await guild.channels.fetch(job.channelId);
    if (!channel) throw new Error(`Channel ${job.channelId} not found in guild ${job.guildId}`);

    const components = this.buildReminderComponents(event);
    if (!components) throw new Error(`Could not build reminder components for topic ${job.newsId}`);

    await (channel as TextChannel).send({ components, flags: MessageFlags.IsComponentsV2 });
  }
}
