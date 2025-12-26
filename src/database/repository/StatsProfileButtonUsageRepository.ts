import { eq, sql } from "drizzle-orm";
import { database } from "../connection.ts";
import { statsProfileButtonUsage } from "../schema/statistics.ts";

export class StatsProfileButtonUsageRepository {
  public static async increment(date: Date, buttonName: string): Promise<void> {
    await database
      .insert(statsProfileButtonUsage)
      .values({
        date,
        buttonName,
        count: 1,
      })
      .onDuplicateKeyUpdate({ set: { count: sql`count + 1` } });
  }

  public static async findByDate(date: Date): Promise<Array<{ buttonName: string; count: number }>> {
    return await database
      .select({
        buttonName: statsProfileButtonUsage.buttonName,
        count: statsProfileButtonUsage.count,
      })
      .from(statsProfileButtonUsage)
      .where(eq(statsProfileButtonUsage.date, date));
  }
}
