import { NewNewsQueueJob, NewsQueuePayload, NewsType } from "../database/schema/lodestone-news.ts";
import { NewsQueueRepository } from "../database/repository/NewsQueueRepository.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { PostedNewsMessagesRepository } from "../database/repository/PostedNewsMessagesRepository.ts";
import * as log from "@std/log";

export class NewsQueueService {
  private static buildSearchableContent(newsData: NewsQueuePayload): string {
    const parts: string[] = [];

    if (newsData.title) parts.push(newsData.title);
    if (newsData.tag) parts.push(newsData.tag);
    if (newsData.description?.markdown) parts.push(newsData.description.markdown);

    return parts.join(" ");
  }

  private static parseBlacklistKeywords(keywords: string | null | undefined): string[] {
    if (!keywords) return [];
    return keywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);
  }

  private static isBlacklisted(content: string, keywords: string[]): boolean {
    if (keywords.length === 0) return false;
    const lowerContent = content.toLowerCase();
    return keywords.some((keyword) => lowerContent.includes(keyword));
  }

  public static async enqueueSendJobs(
    newsType: NewsType,
    newsId: number,
    newsData: NewsQueuePayload,
  ): Promise<number> {
    const setups = await SetupsRepository.getAllByType(newsType);
    if (setups.length === 0) return 0;

    const searchableContent = this.buildSearchableContent(newsData);
    let skippedCount = 0;

    const jobs: NewNewsQueueJob[] = [];
    for (const setup of setups) {
      const blacklistKeywords = this.parseBlacklistKeywords(setup.blacklistKeywords);

      if (this.isBlacklisted(searchableContent, blacklistKeywords)) {
        skippedCount++;
        log.info(
          `[QUEUE] Skipping ${newsType} for guild ${setup.guildId} due to blacklist match`,
        );
        continue;
      }

      jobs.push({
        jobType: "SEND",
        newsType,
        newsId,
        guildId: setup.guildId,
        channelId: setup.channelId,
        messageId: null,
        status: "PENDING",
        retryCount: 0,
        priority: 0,
        payload: newsData,
        errorMessage: null,
      });
    }

    if (jobs.length === 0) {
      if (skippedCount > 0) {
        log.info(`[QUEUE] All ${skippedCount} guilds skipped ${newsType} article ID ${newsId} due to blacklist`);
      }
      return 0;
    }

    await NewsQueueRepository.addMany(jobs);
    const logMessage = skippedCount > 0
      ? `[QUEUE] Enqueued ${jobs.length} SEND jobs for ${newsType} article ID ${newsId} (${skippedCount} skipped due to blacklist)`
      : `[QUEUE] Enqueued ${jobs.length} SEND jobs for ${newsType} article ID ${newsId}`;
    log.info(logMessage);
    return jobs.length;
  }

  public static async enqueueUpdateJobs(
    newsType: NewsType,
    newsId: number,
    newsData: NewsQueuePayload,
  ): Promise<number> {
    const postedMessages = await PostedNewsMessagesRepository.findByNewsIdAndVersion(newsType, newsId, true);
    if (postedMessages.length === 0) return 0;

    const jobs: NewNewsQueueJob[] = postedMessages.map((msg) => ({
      jobType: "UPDATE",
      newsType,
      newsId,
      guildId: msg.guildId,
      channelId: msg.channelId,
      messageId: msg.messageId,
      status: "PENDING",
      retryCount: 0,
      priority: 1,
      payload: newsData,
      errorMessage: null,
    }));

    await NewsQueueRepository.addMany(jobs);
    log.info(`[QUEUE] Enqueued ${jobs.length} UPDATE jobs for ${newsType} article ID ${newsId}`);
    return jobs.length;
  }
}
