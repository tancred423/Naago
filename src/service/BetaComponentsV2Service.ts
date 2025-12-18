import { ContainerBuilder, MediaGalleryBuilder, MessageFlags, TextChannel, time, TimestampStyles } from "discord.js";
import { DiscordComponentsV2 } from "../naagostone/type/DiscordComponentsV2.ts";
import { GlobalClient } from "../index.ts";
import * as log from "@std/log";

const MAX_TOTAL_CHARACTERS = 4000;
const MAX_TOTAL_COMPONENTS = 40;

type NewsType = "topics" | "notices" | "maintenances" | "updates" | "statuses";

interface NewsData {
  title: string;
  link: string;
  date: number;
  banner?: string;
  tag?: string | null;
  description: {
    html: string;
    markdown: string;
    discord_components_v2?: DiscordComponentsV2;
  };
}

function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function getNewsTypeLabel(type: NewsType, tag?: string | null): string {
  if (tag) return tag;
  switch (type) {
    case "topics":
      return "Topic";
    case "notices":
      return "Notice";
    case "maintenances":
      return "Maintenance";
    case "updates":
      return "Update";
    case "statuses":
      return "Status";
  }
}

function getColorEnvKey(type: NewsType): string {
  switch (type) {
    case "topics":
      return "COLOR_TOPICS";
    case "notices":
      return "COLOR_NOTICES";
    case "maintenances":
      return "COLOR_MAINTENANCES";
    case "updates":
      return "COLOR_UPDATES";
    case "statuses":
      return "COLOR_STATUS";
  }
}

function getBetaChannelEnvKey(type: NewsType): string {
  switch (type) {
    case "topics":
      return "BETA_CHANNEL_ID_TOPICS";
    case "notices":
      return "BETA_CHANNEL_ID_NOTICES";
    case "maintenances":
      return "BETA_CHANNEL_ID_MAINTENANCES";
    case "updates":
      return "BETA_CHANNEL_ID_UPDATES";
    case "statuses":
      return "BETA_CHANNEL_ID_STATUSES";
  }
}

function getNewsEmojiEnvKey(type: NewsType): string {
  switch (type) {
    case "topics":
      return "EMOJI_NEWS_TOPIC";
    case "notices":
      return "EMOJI_NEWS_NOTICE";
    case "maintenances":
      return "EMOJI_NEWS_MAINTENANCE";
    case "updates":
      return "EMOJI_NEWS_UPDATE";
    case "statuses":
      return "EMOJI_NEWS_STATUS";
  }
}

export class BetaComponentsV2Service {
  public static async sendToBetaChannel(newsType: NewsType, data: NewsData): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;

    const betaGuildId = Deno.env.get("BETA_GUILD_ID_NEWS");
    const betaChannelId = Deno.env.get(getBetaChannelEnvKey(newsType));

    if (!betaGuildId || !betaChannelId) return;

    if (!data.description.discord_components_v2) return;

    try {
      const guild = await client.guilds.fetch(betaGuildId);
      if (!guild) return;
      const channel = await guild.channels.fetch(betaChannelId);
      if (!channel) return;

      const container = this.buildContainer(newsType, data);
      if (!container) return;

      await (channel as TextChannel).send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.error(`[BETA V2] Sending ${newsType} to beta channel was NOT successful: ${error.stack}`);
      }
    }
  }

  private static buildContainer(newsType: NewsType, data: NewsData): ContainerBuilder | null {
    const colorHex = Deno.env.get(getColorEnvKey(newsType));
    if (!colorHex) return null;

    const componentsV2 = data.description.discord_components_v2;
    if (!componentsV2) return null;

    const container = new ContainerBuilder().setAccentColor(hexToNumber(colorHex));

    let totalCharacters = 0;
    let totalComponents = 0;

    const newsEmoji = Deno.env.get(getNewsEmojiEnvKey(newsType)) ?? "";
    const lodestoneEmoji = Deno.env.get("EMOJI_LODESTONE") ?? "";
    const typeLabel = `${newsEmoji}  **${getNewsTypeLabel(newsType, data.tag)}**`;
    const titleMarkdown = `## [${data.title}](${data.link})`;
    const footerText = `${lodestoneEmoji}  Lodestone · ${
      time(Math.floor(data.date / 1000), TimestampStyles.LongDateTime)
    }`;

    totalCharacters += typeLabel.length + titleMarkdown.length + footerText.length;
    totalComponents += 4;

    if (data.banner) {
      totalComponents += 1;
    }

    for (const component of componentsV2.components) {
      if (component.type === "textDisplay") {
        totalCharacters += component.content.length;
        totalComponents += 1;
      } else if (component.type === "mediaGallery") {
        totalComponents += 1 + component.urls.length;
      } else if (component.type === "separator") {
        totalComponents += 1;
      }
    }

    if (totalCharacters > MAX_TOTAL_CHARACTERS || totalComponents > MAX_TOTAL_COMPONENTS) {
      log.warn(
        `[BETA V2] ${newsType} message exceeds limits (chars: ${totalCharacters}/${MAX_TOTAL_CHARACTERS}, components: ${totalComponents}/${MAX_TOTAL_COMPONENTS}). Truncating...`,
      );
    }

    let currentCharacters = 0;
    let currentComponents = 0;

    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(typeLabel));
    currentCharacters += typeLabel.length;
    currentComponents += 1;

    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(titleMarkdown));
    currentCharacters += titleMarkdown.length;
    currentComponents += 1;

    if (data.banner) {
      const bannerGallery = new MediaGalleryBuilder().addItems((item) =>
        item.setDescription("Banner image").setURL(data.banner!)
      );
      container.addMediaGalleryComponents(bannerGallery);
      currentComponents += 2;
    }

    for (const component of componentsV2.components) {
      if (currentComponents >= MAX_TOTAL_COMPONENTS - 2) break;

      if (component.type === "textDisplay") {
        const remainingChars = MAX_TOTAL_CHARACTERS - currentCharacters - footerText.length;
        if (remainingChars <= 0) break;

        let content = component.content;
        if (content.length > remainingChars) {
          content = content.substring(0, remainingChars - 3) + "...";
        }

        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(content));
        currentCharacters += content.length;
        currentComponents += 1;
      } else if (component.type === "mediaGallery") {
        const remainingComponentSlots = MAX_TOTAL_COMPONENTS - currentComponents - 2;
        if (remainingComponentSlots <= 1) break;

        const maxItems = Math.min(component.urls.length, remainingComponentSlots - 1);
        const gallery = new MediaGalleryBuilder();

        for (let i = 0; i < maxItems; i++) {
          gallery.addItems((item) => item.setDescription("Image").setURL(component.urls[i]));
        }

        container.addMediaGalleryComponents(gallery);
        currentComponents += 1 + maxItems;
      } else if (component.type === "separator") {
        container.addSeparatorComponents((separator) => separator);
        currentComponents += 1;
      }
    }

    container.addSeparatorComponents((separator) => separator);
    currentComponents += 1;

    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(footerText));
    currentCharacters += footerText.length;
    currentComponents += 1;

    return container;
  }
}
