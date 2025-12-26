import { eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { statsVerifiedCharacters } from "../schema/statistics.ts";

export class StatsVerifiedCharactersRepository {
  public static async addOrUpdate(date: Date, count: number): Promise<void> {
    await database
      .insert(statsVerifiedCharacters)
      .values({
        date,
        count,
      })
      .onDuplicateKeyUpdate({ set: { count } });
  }

  public static async findByDate(date: Date): Promise<{ count: number } | null> {
    const result = await database
      .select({ count: statsVerifiedCharacters.count })
      .from(statsVerifiedCharacters)
      .where(eq(statsVerifiedCharacters.date, date))
      .limit(1);

    return result[0] ?? null;
  }
}
