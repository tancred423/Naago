import { eq, sql } from "drizzle-orm";
import { database } from "../connection.ts";
import { statsThemeUsage } from "../schema/statistics.ts";

export class StatsThemeUsageRepository {
  public static async increment(date: Date, themeName: string): Promise<void> {
    await database
      .insert(statsThemeUsage)
      .values({
        date,
        themeName,
        count: 1,
      })
      .onDuplicateKeyUpdate({ set: { count: sql`count + 1` } });
  }

  public static async findByDate(date: Date): Promise<Array<{ themeName: string; count: number }>> {
    return await database
      .select({
        themeName: statsThemeUsage.themeName,
        count: statsThemeUsage.count,
      })
      .from(statsThemeUsage)
      .where(eq(statsThemeUsage.date, date));
  }
}
