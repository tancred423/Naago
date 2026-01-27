import { MessageFlags, TextChannel } from "discord.js";
import { GlobalClient } from "../GlobalClient.ts";
import { NewsQueueRepository } from "../database/repository/NewsQueueRepository.ts";
import { PostedNewsMessagesRepository } from "../database/repository/PostedNewsMessagesRepository.ts";
import { NewsQueueJob, NewsType } from "../database/schema/lodestone-news.ts";
import { ComponentsV2Service } from "./ComponentsV2Service.ts";
import * as log from "@std/log";

// Rate limits (Discord API)
// Per-channel: 5 messages per 5 seconds (1 per second per channel)
// Per-guild: 120 requests per 60 seconds (2 per second per guild)
// Global: 50 requests per second
// We use 40 to leave 20% headroom for user commands and other operations
const MAX_CONCURRENT_JOBS = 40; // Leave headroom for user commands
const MIN_INTERVAL_MS = 25; // 40 requests/second = 25ms between requests
const IDLE_CHECK_INTERVAL_MS = 5000; // Check every 5 seconds when no jobs
const ACTIVE_CHECK_INTERVAL_MS = 100; // Check every 100ms when jobs exist
const MAX_RETRIES = 3;

interface ChannelRateLimit {
  channelId: string;
  lastSent: number;
  count: number;
  windowStart: number;
}

export class NewsQueueProcessor {
  private static isProcessing = false;
  private static intervalId: ReturnType<typeof setInterval> | null = null;
  private static currentJobs = new Set<number>();
  private static channelRateLimits = new Map<string, ChannelRateLimit>();
  private static lastCheckHadJobs = false;

  public static start(): void {
    if (this.isProcessing) {
      log.warn("[QUEUE PROCESSOR] Processor is already running");
      return;
    }

    log.info("[QUEUE PROCESSOR] Starting queue processor");
    this.isProcessing = true;

    this.resetStuckJobs().catch((err) => {
      log.error(`[QUEUE PROCESSOR] Failed to reset stuck jobs: ${err instanceof Error ? err.stack : String(err)}`);
    });

    this.processLoop();
  }

  public static stop(): void {
    if (!this.isProcessing) {
      return;
    }

    log.info("[QUEUE PROCESSOR] Stopping queue processor");
    this.isProcessing = false;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private static processLoop(): void {
    const processWithAdaptiveInterval = async () => {
      if (!this.isProcessing) return;

      const pendingCount = await NewsQueueRepository.getPendingCount();
      const hasJobs = pendingCount > 0;

      if (hasJobs !== this.lastCheckHadJobs) {
        if (this.intervalId !== null) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }

        const interval = hasJobs ? ACTIVE_CHECK_INTERVAL_MS : IDLE_CHECK_INTERVAL_MS;
        this.lastCheckHadJobs = hasJobs;

        this.intervalId = setInterval(() => {
          processWithAdaptiveInterval().catch((err) => {
            log.error(`[QUEUE PROCESSOR] Error in process loop: ${err instanceof Error ? err.stack : String(err)}`);
          });
        }, interval);
      }

      if (hasJobs) {
        await this.processJobs();
      }
    };

    processWithAdaptiveInterval().catch((err) => {
      log.error(`[QUEUE PROCESSOR] Error in initial check: ${err instanceof Error ? err.stack : String(err)}`);
    });

    this.intervalId = setInterval(() => {
      processWithAdaptiveInterval().catch((err) => {
        log.error(`[QUEUE PROCESSOR] Error checking for jobs: ${err instanceof Error ? err.stack : String(err)}`);
      });
    }, IDLE_CHECK_INTERVAL_MS);
  }

  private static async processJobs(): Promise<void> {
    const pendingCount = await NewsQueueRepository.getPendingCount();
    if (pendingCount > 10000) {
      log.warn(`[QUEUE ALERT] Queue backing up: ${pendingCount} pending jobs`);
    }

    const availableSlots = MAX_CONCURRENT_JOBS - this.currentJobs.size;
    if (availableSlots <= 0) return;

    const batchSize = Math.min(availableSlots, MAX_CONCURRENT_JOBS);
    const jobs = await NewsQueueRepository.getNextPendingJobsBatch(batchSize);

    if (jobs.length === 0) return;

    const now = Date.now();
    const processableJobs: NewsQueueJob[] = [];

    for (const job of jobs) {
      const channelKey = `${job.guildId}:${job.channelId}`;
      const limit = this.channelRateLimits.get(channelKey);

      if (!limit) {
        processableJobs.push(job);
        this.channelRateLimits.set(channelKey, {
          channelId: job.channelId,
          lastSent: now,
          count: 1,
          windowStart: now,
        });
      } else {
        const timeSinceWindowStart = now - limit.windowStart;
        if (timeSinceWindowStart >= 5000) {
          processableJobs.push(job);
          this.channelRateLimits.set(channelKey, {
            channelId: job.channelId,
            lastSent: now,
            count: 1,
            windowStart: now,
          });
        } else if (limit.count < 5) {
          processableJobs.push(job);
          limit.count++;
          limit.lastSent = now;
        }
      }
    }

    if (processableJobs.length === 0) return;

    const jobIds = processableJobs.map((j) => j.id);
    await NewsQueueRepository.markManyAsProcessing(jobIds);

    for (const job of processableJobs) {
      this.currentJobs.add(job.id);

      const delay = processableJobs.indexOf(job) * MIN_INTERVAL_MS;
      setTimeout(() => {
        this.processJob(job).finally(() => {
          this.currentJobs.delete(job.id);
        });
      }, delay);
    }
  }

  private static async processJob(job: NewsQueueJob): Promise<void> {
    try {
      if (job.jobType === "SEND") {
        await this.processSendJob(job);
      } else if (job.jobType === "UPDATE") {
        await this.processUpdateJob(job);
      } else {
        throw new Error(`Unknown job type: ${job.jobType}`);
      }

      await NewsQueueRepository.markAsCompleted(job.id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage === "Missing Permissions") {
        await NewsQueueRepository.markAsStoppedMissingPermissions(job.id);
        return;
      }

      if (errorMessage === "Unknown Channel") {
        await NewsQueueRepository.markAsStoppedUnknownChannel(job.id);
        return;
      }

      if (errorMessage === "Unknown Guild") {
        await NewsQueueRepository.markAsStoppedUnknownGuild(job.id);
        return;
      }

      if (errorMessage === "Missing Access") {
        await NewsQueueRepository.markAsStoppedMissingAccess(job.id);
        return;
      }

      log.error(`[QUEUE PROCESSOR] Job ${job.id} failed: ${errorMessage}`);
      await NewsQueueRepository.markAsFailed(job.id, errorMessage, job.retryCount);

      if (job.retryCount >= MAX_RETRIES) {
        log.error(`[QUEUE PROCESSOR] Job ${job.id} exceeded max retries and will not be retried`);
      }
    }
  }

  private static async processSendJob(job: NewsQueueJob): Promise<void> {
    const client = GlobalClient.client;
    if (!client) {
      throw new Error("Discord client is not available");
    }

    if (!job.payload) {
      throw new Error("Job payload is missing");
    }

    const guild = await client.guilds.fetch(job.guildId);
    if (!guild) {
      throw new Error(`Guild ${job.guildId} not found`);
    }

    const channel = await guild.channels.fetch(job.channelId);
    if (!channel) {
      throw new Error(`Channel ${job.channelId} not found in guild ${job.guildId}`);
    }

    const container = ComponentsV2Service.buildContainer(job.newsType as NewsType, job.payload);
    if (!container) {
      throw new Error(`Failed to build container for ${job.newsType}`);
    }

    const message = await (channel as TextChannel).send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    await PostedNewsMessagesRepository.add(
      job.newsType as NewsType,
      job.newsId,
      job.guildId,
      job.channelId,
      message.id,
      true,
    );
  }

  private static async processUpdateJob(job: NewsQueueJob): Promise<void> {
    const client = GlobalClient.client;
    if (!client) {
      throw new Error("Discord client is not available");
    }

    if (!job.payload) {
      throw new Error("Job payload is missing");
    }

    if (!job.messageId) {
      throw new Error("Message ID is required for UPDATE jobs");
    }

    const guild = await client.guilds.fetch(job.guildId);
    if (!guild) {
      throw new Error(`Guild ${job.guildId} not found`);
    }

    const channel = await guild.channels.fetch(job.channelId);
    if (!channel) {
      throw new Error(`Channel ${job.channelId} not found in guild ${job.guildId}`);
    }

    const message = await (channel as TextChannel).messages.fetch(job.messageId);
    if (!message) {
      throw new Error(`Message ${job.messageId} not found in channel ${job.channelId}`);
    }

    const container = ComponentsV2Service.buildContainerForUpdate(job.newsType as NewsType, job.payload);
    if (!container) {
      throw new Error(`Failed to build container for ${job.newsType}`);
    }

    await message.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      content: null,
      embeds: [],
    });
  }

  private static async resetStuckJobs(): Promise<void> {
    const resetCount = await NewsQueueRepository.resetStuckJobs();
    if (resetCount > 0) {
      log.warn(`[QUEUE PROCESSOR] Reset ${resetCount} stuck job(s)`);
    }
  }

  public static async getStats(): Promise<{ pending: number; failed: number; processing: number; completed: number }> {
    const [pending, failed, completed] = await Promise.all([
      NewsQueueRepository.getPendingCount(),
      NewsQueueRepository.getFailedCount(),
      NewsQueueRepository.getCompletedCount(),
    ]);

    return { pending, failed, processing: this.currentJobs.size, completed };
  }
}
