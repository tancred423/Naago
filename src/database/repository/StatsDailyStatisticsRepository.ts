import { eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { statsDailyStatistics } from "../schema/statistics.ts";

export class StatsDailyStatisticsRepository {
  public static async addOrUpdate(date: Date, activeUserCount: number): Promise<void> {
    await database
      .insert(statsDailyStatistics)
      .values({
        date,
        activeUserCount,
      })
      .onDuplicateKeyUpdate({ set: { activeUserCount } });
  }

  public static async findByDate(date: Date): Promise<{ activeUserCount: number } | null> {
    const result = await database
      .select({ activeUserCount: statsDailyStatistics.activeUserCount })
      .from(statsDailyStatistics)
      .where(eq(statsDailyStatistics.date, date))
      .limit(1);

    return result[0] ?? null;
  }
}
