import { eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { ProfilePage, profilePages } from "../schema/profile-pages.ts";

export class ProfilePagesRepository {
  public static async find(
    userId: string,
  ): Promise<ProfilePage | null> {
    const result = await database
      .select()
      .from(profilePages)
      .where(eq(profilePages.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }

  public static async set(
    userId: string,
    profilePage: string,
  ): Promise<void> {
    await database
      .insert(profilePages)
      .values({ userId, profilePage })
      .onDuplicateKeyUpdate({ set: { profilePage } });
  }

  public static async delete(userId: string): Promise<void> {
    await database
      .delete(profilePages)
      .where(eq(profilePages.userId, userId));
  }
}
