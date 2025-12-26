import { and, eq, sql } from "drizzle-orm";
import { type Verification, verifications } from "../schema/verifications.ts";
import { database } from "../connection.ts";

export class VerificationsRepository {
  public static async find(
    userId: string,
  ): Promise<Verification | null> {
    const result = await database
      .select()
      .from(verifications)
      .where(eq(verifications.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }

  public static async setVerificationCode(
    userId: string,
    characterId: number,
    verificationCode: string,
  ): Promise<void> {
    await database
      .insert(verifications)
      .values({ userId, characterId, verificationCode, isVerified: false })
      .onDuplicateKeyUpdate({ set: { verificationCode } });
  }

  public static async setVerification(
    userId: string,
    characterId: number,
  ): Promise<void> {
    await database
      .update(verifications)
      .set({ characterId, isVerified: true })
      .where(eq(verifications.userId, userId));
  }

  public static async delete(userId: string, characterId: number): Promise<void> {
    await database
      .delete(verifications)
      .where(and(
        eq(verifications.userId, userId),
        eq(verifications.characterId, characterId),
      ));
  }

  public static async countVerifiedCharacters(): Promise<number> {
    const result = await database
      .select({ count: sql<number>`COUNT(DISTINCT ${verifications.characterId})` })
      .from(verifications)
      .where(eq(verifications.isVerified, true));

    return result[0]?.count ?? 0;
  }
}
