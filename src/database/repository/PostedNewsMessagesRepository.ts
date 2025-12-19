import { and, eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { NewsType, PostedNewsMessage, postedNewsMessages } from "../schema/lodestone-news.ts";

export class PostedNewsMessagesRepository {
  public static async add(
    newsType: NewsType,
    newsId: number,
    guildId: string,
    channelId: string,
    messageId: string,
    isV2: boolean = false,
  ): Promise<void> {
    await database.insert(postedNewsMessages).values({
      newsType,
      newsId,
      guildId,
      channelId,
      messageId,
      isV2: isV2 ? 1 : 0,
    });
  }

  public static async findByNewsId(
    newsType: NewsType,
    newsId: number,
  ): Promise<PostedNewsMessage[]> {
    return await database
      .select()
      .from(postedNewsMessages)
      .where(
        and(
          eq(postedNewsMessages.newsType, newsType),
          eq(postedNewsMessages.newsId, newsId),
        ),
      );
  }

  public static async findByNewsIdAndVersion(
    newsType: NewsType,
    newsId: number,
    isV2: boolean,
  ): Promise<PostedNewsMessage[]> {
    return await database
      .select()
      .from(postedNewsMessages)
      .where(
        and(
          eq(postedNewsMessages.newsType, newsType),
          eq(postedNewsMessages.newsId, newsId),
          eq(postedNewsMessages.isV2, isV2 ? 1 : 0),
        ),
      );
  }

  public static async deleteByGuildId(guildId: string): Promise<void> {
    await database
      .delete(postedNewsMessages)
      .where(eq(postedNewsMessages.guildId, guildId));
  }

  public static async deleteByMessageId(
    guildId: string,
    channelId: string,
    messageId: string,
  ): Promise<void> {
    await database
      .delete(postedNewsMessages)
      .where(
        and(
          eq(postedNewsMessages.guildId, guildId),
          eq(postedNewsMessages.channelId, channelId),
          eq(postedNewsMessages.messageId, messageId),
        ),
      );
  }
}
