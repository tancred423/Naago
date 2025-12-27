import { NewsType } from "../database/schema/lodestone-news.ts";
import { NewsQueueService } from "./NewsQueueService.ts";
import { NewsData } from "./ComponentsV2Service.ts";

export class NewsMessageUpdateService {
  public static async updatePostedMessages(
    newsType: NewsType,
    newsId: number,
    newsData: NewsData,
  ): Promise<{ updated: number; failed: number }> {
    const queuePayload = {
      title: newsData.title,
      link: newsData.link,
      date: newsData.date,
      banner: newsData.banner,
      tag: newsData.tag,
      description: newsData.description,
    };

    const enqueuedCount = await NewsQueueService.enqueueUpdateJobs(newsType, newsId, queuePayload);

    return { updated: enqueuedCount, failed: 0 };
  }
}
