import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { database } from "../connection.ts";
import { NewNewsQueueJob, newsQueue, NewsQueueJob, NewsType } from "../schema/lodestone-news.ts";

export class NewsQueueRepository {
  public static async add(job: NewNewsQueueJob): Promise<number> {
    const result = await database.insert(newsQueue).values(job);
    return result[0].insertId;
  }

  public static async addMany(jobs: NewNewsQueueJob[]): Promise<void> {
    if (jobs.length === 0) return;
    await database.insert(newsQueue).values(jobs);
  }

  public static async getNextPendingJob(): Promise<NewsQueueJob | null> {
    const jobs = await database
      .select()
      .from(newsQueue)
      .where(eq(newsQueue.status, "PENDING"))
      .orderBy(desc(newsQueue.priority), asc(newsQueue.createdAt))
      .limit(1);

    return jobs[0] || null;
  }

  public static async getNextPendingJobsBatch(limit: number): Promise<NewsQueueJob[]> {
    const jobs = await database
      .select()
      .from(newsQueue)
      .where(eq(newsQueue.status, "PENDING"))
      .orderBy(desc(newsQueue.priority), asc(newsQueue.createdAt))
      .limit(limit);

    return jobs;
  }

  public static async markManyAsProcessing(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await database
      .update(newsQueue)
      .set({
        status: "PROCESSING",
        updatedAt: sql`NOW()`,
      })
      .where(inArray(newsQueue.id, ids));
  }

  public static async markAsProcessing(id: number): Promise<void> {
    await database
      .update(newsQueue)
      .set({
        status: "PROCESSING",
        updatedAt: sql`NOW()`,
      })
      .where(eq(newsQueue.id, id));
  }

  public static async markAsCompleted(id: number): Promise<void> {
    await database
      .update(newsQueue)
      .set({
        status: "COMPLETED",
        processedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(newsQueue.id, id));
  }

  public static async markAsFailed(id: number, errorMessage: string, retryCount: number): Promise<void> {
    await database
      .update(newsQueue)
      .set({
        status: retryCount >= 3 ? "FAILED" : "PENDING",
        retryCount: retryCount + 1,
        errorMessage,
        updatedAt: sql`NOW()`,
      })
      .where(eq(newsQueue.id, id));
  }

  public static async markAsStoppedMissingPermissions(id: number): Promise<void> {
    await database
      .update(newsQueue)
      .set({
        status: "STOPPED_MISSING_PERMISSIONS",
        errorMessage: "Missing Permissions",
        updatedAt: sql`NOW()`,
      })
      .where(eq(newsQueue.id, id));
  }

  public static async markAsStoppedUnknownChannel(id: number): Promise<void> {
    await database
      .update(newsQueue)
      .set({
        status: "STOPPED_UNKNOWN_CHANNEL",
        errorMessage: "Unknown Channel",
        updatedAt: sql`NOW()`,
      })
      .where(eq(newsQueue.id, id));
  }

  public static async markAsStoppedUnknownGuild(id: number): Promise<void> {
    await database
      .update(newsQueue)
      .set({
        status: "STOPPED_UNKNOWN_GUILD",
        errorMessage: "Unknown Guild",
        updatedAt: sql`NOW()`,
      })
      .where(eq(newsQueue.id, id));
  }

  public static async markAsStoppedMissingAccess(id: number): Promise<void> {
    await database
      .update(newsQueue)
      .set({
        status: "STOPPED_MISSING_ACCESS",
        errorMessage: "Missing Access",
        updatedAt: sql`NOW()`,
      })
      .where(eq(newsQueue.id, id));
  }

  public static async resetStuckJobs(): Promise<number> {
    const result = await database
      .update(newsQueue)
      .set({
        status: "PENDING",
        updatedAt: sql`NOW()`,
      })
      .where(
        and(
          eq(newsQueue.status, "PROCESSING"),
          sql`${newsQueue.updatedAt} < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
        ),
      );

    return result[0].affectedRows;
  }

  public static async getPendingCount(): Promise<number> {
    const result = await database
      .select({ count: sql<number>`COUNT(*)` })
      .from(newsQueue)
      .where(eq(newsQueue.status, "PENDING"));

    return result[0]?.count || 0;
  }

  public static async getFailedCount(): Promise<number> {
    const result = await database
      .select({ count: sql<number>`COUNT(*)` })
      .from(newsQueue)
      .where(eq(newsQueue.status, "FAILED"));

    return result[0]?.count || 0;
  }

  public static async getCompletedCount(): Promise<number> {
    const result = await database
      .select({ count: sql<number>`COUNT(*)` })
      .from(newsQueue)
      .where(eq(newsQueue.status, "COMPLETED"));

    return result[0]?.count || 0;
  }

  public static async deleteOldCompletedJobs(daysOld: number = 7): Promise<number> {
    const result = await database
      .delete(newsQueue)
      .where(
        and(
          eq(newsQueue.status, "COMPLETED"),
          sql`${newsQueue.processedAt} < DATE_SUB(NOW(), INTERVAL ${daysOld} DAY)`,
        ),
      );

    return result[0].affectedRows;
  }

  public static async deleteByNewsId(newsType: NewsType, newsId: number): Promise<void> {
    await database
      .delete(newsQueue)
      .where(
        and(
          eq(newsQueue.newsType, newsType),
          eq(newsQueue.newsId, newsId),
          inArray(newsQueue.status, ["PENDING", "PROCESSING"]),
        ),
      );
  }
}
