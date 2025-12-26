import { eq, sql } from "drizzle-orm";
import { database } from "../connection.ts";
import { statsCommandUsage } from "../schema/statistics.ts";

export class StatsCommandUsageRepository {
  public static async increment(date: Date, commandName: string): Promise<void> {
    await database
      .insert(statsCommandUsage)
      .values({
        date,
        commandName,
        count: 1,
      })
      .onDuplicateKeyUpdate({ set: { count: sql`count + 1` } });
  }

  public static async findByDate(date: Date): Promise<Array<{ commandName: string; count: number }>> {
    return await database
      .select({
        commandName: statsCommandUsage.commandName,
        count: statsCommandUsage.count,
      })
      .from(statsCommandUsage)
      .where(eq(statsCommandUsage.date, date));
  }
}
