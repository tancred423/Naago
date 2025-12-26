import { eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { statsLodestoneNewsSetups } from "../schema/statistics.ts";

export class StatsLodestoneNewsSetupsRepository {
  public static async addOrUpdate(date: Date, serverCount: number): Promise<void> {
    await database
      .insert(statsLodestoneNewsSetups)
      .values({
        date,
        serverCount,
      })
      .onDuplicateKeyUpdate({ set: { serverCount } });
  }

  public static async findByDate(date: Date): Promise<{ serverCount: number } | null> {
    const result = await database
      .select({ serverCount: statsLodestoneNewsSetups.serverCount })
      .from(statsLodestoneNewsSetups)
      .where(eq(statsLodestoneNewsSetups.date, date))
      .limit(1);

    return result[0] ?? null;
  }
}
