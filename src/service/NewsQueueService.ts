import { NewNewsQueueJob, NewsQueuePayload, NewsType } from "../database/schema/lodestone-news.ts";
import { NewsQueueRepository } from "../database/repository/NewsQueueRepository.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { PostedNewsMessagesRepository } from "../database/repository/PostedNewsMessagesRepository.ts";
import * as log from "@std/log";

export class NewsQueueService {
  public static async enqueueSendJobs(
    newsType: NewsType,
    newsId: number,
    newsData: NewsQueuePayload,
  ): Promise<number> {
    const setups = await SetupsRepository.getAllByType(newsType);
    if (setups.length === 0) return 0;

    const jobs: NewNewsQueueJob[] = setups.map((setup) => ({
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
    }));

    await NewsQueueRepository.addMany(jobs);
    log.info(`[QUEUE] Enqueued ${jobs.length} SEND jobs for ${newsType} article ID ${newsId}`);
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
