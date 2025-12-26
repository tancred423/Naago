import { eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { statsServerCounts } from "../schema/statistics.ts";

export class StatsServerCountsRepository {
  public static async addOrUpdate(date: Date, count: number): Promise<void> {
    await database
      .insert(statsServerCounts)
      .values({
        date,
        count,
      })
      .onDuplicateKeyUpdate({ set: { count } });
  }

  public static async findByDate(date: Date): Promise<{ count: number } | null> {
    const result = await database
      .select({ count: statsServerCounts.count })
      .from(statsServerCounts)
      .where(eq(statsServerCounts.date, date))
      .limit(1);

    return result[0] ?? null;
  }
}
