import { eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { statsThemeUsage } from "../schema/statistics.ts";

export class StatsThemeUsageRepository {
  public static async addOrUpdate(date: Date, themeName: string, count: number): Promise<void> {
    await database
      .insert(statsThemeUsage)
      .values({
        date,
        themeName,
        count,
      })
      .onDuplicateKeyUpdate({ set: { count } });
  }

  public static async deleteByDate(date: Date): Promise<void> {
    await database
      .delete(statsThemeUsage)
      .where(eq(statsThemeUsage.date, date));
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
