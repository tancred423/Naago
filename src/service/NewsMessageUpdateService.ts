import { MessageFlags, TextChannel } from "discord.js";
import { GlobalClient } from "../GlobalClient.ts";
import { PostedNewsMessagesRepository } from "../database/repository/PostedNewsMessagesRepository.ts";
import { NewsType, PostedNewsMessage } from "../database/schema/lodestone-news.ts";
import { ComponentsV2Service, NewsData } from "./ComponentsV2Service.ts";
import * as log from "@std/log";

export class NewsMessageUpdateService {
  public static async updatePostedMessages(
    newsType: NewsType,
    newsId: number,
    newsData: NewsData,
  ): Promise<{ updated: number; failed: number }> {
    const client = GlobalClient.client;
    if (!client) return { updated: 0, failed: 0 };

    let updated = 0;
    let failed = 0;

    const v2Messages = await PostedNewsMessagesRepository.findByNewsIdAndVersion(newsType, newsId, true);
    for (const msg of v2Messages) {
      const success = await this.updateV2Message(msg, newsType, newsData);
      if (success) updated++;
      else failed++;
    }

    return { updated, failed };
  }

  private static async updateV2Message(
    postedMessage: PostedNewsMessage,
    newsType: NewsType,
    newsData: NewsData,
  ): Promise<boolean> {
    const client = GlobalClient.client;
    if (!client) return false;

    try {
      const guild = await client.guilds.fetch(postedMessage.guildId);
      if (!guild) return false;

      const channel = await guild.channels.fetch(postedMessage.channelId);
      if (!channel) return false;

      const message = await (channel as TextChannel).messages.fetch(postedMessage.messageId);
      if (!message) return false;

      const container = ComponentsV2Service.buildContainerForUpdate(newsType, newsData);
      if (!container) return false;

      await message.edit({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: null,
        embeds: [],
      });
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.warn(
          `[NEWS UPDATE] Failed to update V2 message ${postedMessage.messageId} in guild ${postedMessage.guildId}: ${error.message}`,
        );
      }
      return false;
    }
  }
}
