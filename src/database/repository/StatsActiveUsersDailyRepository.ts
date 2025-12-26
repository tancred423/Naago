import { eq, sql } from "drizzle-orm";
import { database } from "../connection.ts";
import { statsActiveUsersDaily } from "../schema/statistics.ts";

export class StatsActiveUsersDailyRepository {
  public static async add(hashedUserId: string, date: Date): Promise<void> {
    await database
      .insert(statsActiveUsersDaily)
      .values({
        hashedUserId,
        date,
      })
      .onDuplicateKeyUpdate({ set: { hashedUserId } });
  }

  public static async countUniqueUsersForDate(date: Date): Promise<number> {
    const result = await database
      .select({ count: sql<number>`COUNT(DISTINCT ${statsActiveUsersDaily.hashedUserId})` })
      .from(statsActiveUsersDaily)
      .where(eq(statsActiveUsersDaily.date, date));

    return result[0]?.count ?? 0;
  }

  public static async deleteOldData(daysToKeep: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    cutoffDate.setHours(0, 0, 0, 0);

    await database
      .delete(statsActiveUsersDaily)
      .where(sql`${statsActiveUsersDaily.date} < ${cutoffDate}`);
  }
}
