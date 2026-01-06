import { ContainerBuilder, MediaGalleryBuilder, time, TimestampStyles } from "discord.js";
import { DiscordComponentsV2 } from "../naagostone/type/DiscordComponentsV2.ts";
import { NewsType } from "../database/schema/lodestone-news.ts";
import { NewsQueueService } from "./NewsQueueService.ts";
import * as log from "@std/log";

const MAX_TOTAL_CHARACTERS = 4000;
const MAX_TOTAL_COMPONENTS = 40;

export interface NewsData {
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

export class ComponentsV2Service {
  public static async send(newsType: NewsType, data: NewsData, newsId?: number): Promise<void> {
    if (!data.description.discord_components_v2) return;

    if (newsId === undefined) {
      log.warn(`[V2] Cannot queue ${newsType} without newsId`);
      return;
    }

    const queuePayload = {
      title: data.title,
      link: data.link,
      date: data.date,
      banner: data.banner,
      tag: data.tag,
      description: data.description,
    };

    await NewsQueueService.enqueueSendJobs(newsType, newsId, queuePayload);
  }

  public static buildContainerForUpdate(newsType: NewsType, data: NewsData): ContainerBuilder | null {
    return this.buildContainer(newsType, data);
  }

  public static buildContainer(newsType: NewsType, data: NewsData): ContainerBuilder | null {
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
    const titleMarkdown = `### [${data.title}](${data.link})`;
    const footerText = `${lodestoneEmoji}  Lodestone · ${
      time(Math.floor(data.date / 1000), TimestampStyles.ShortDateTime)
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
        `[V2] ${newsType} message exceeds limits (chars: ${totalCharacters}/${MAX_TOTAL_CHARACTERS}, components: ${totalComponents}/${MAX_TOTAL_COMPONENTS}). Truncating...`,
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
      const bannerGallery = new MediaGalleryBuilder().addItems((item) => item.setURL(data.banner!));
      container.addMediaGalleryComponents(bannerGallery);
      currentComponents += 2;
    }

    for (let i = 0; i < componentsV2.components.length; i++) {
      const component = componentsV2.components[i];
      if (currentComponents >= MAX_TOTAL_COMPONENTS - 2) break;

      if (component.type === "textDisplay") {
        const remainingChars = MAX_TOTAL_CHARACTERS - currentCharacters - footerText.length;
        if (remainingChars <= 0) break;

        let content = component.content;
        const isTruncated = content.length > remainingChars;

        if (isTruncated) {
          let canFitMoreTextDisplays = false;
          let simulatedChars = currentCharacters;
          let simulatedComponents = currentComponents;

          const truncatedContent = content.substring(0, remainingChars - 3) + "...";
          simulatedChars += truncatedContent.length;
          simulatedComponents += 1;

          for (let j = i + 1; j < componentsV2.components.length; j++) {
            if (simulatedComponents >= MAX_TOTAL_COMPONENTS - 2) break;

            const nextComponent = componentsV2.components[j];
            if (nextComponent.type === "textDisplay") {
              const nextRemainingChars = MAX_TOTAL_CHARACTERS - simulatedChars - footerText.length;
              if (nextRemainingChars >= 3) {
                canFitMoreTextDisplays = true;
                break;
              }
            } else if (nextComponent.type === "mediaGallery") {
              const remainingComponentSlots = MAX_TOTAL_COMPONENTS - simulatedComponents - 2;
              if (remainingComponentSlots > 1) {
                simulatedComponents += 1 + Math.min(nextComponent.urls.length, remainingComponentSlots - 1);
              }
            } else if (nextComponent.type === "separator") {
              simulatedComponents += 1;
            }
          }

          if (!canFitMoreTextDisplays) {
            const continueReadingText = ` \n\n[*Continue Reading*](${data.link})`;
            const continueReadingLength = continueReadingText.length;
            const minCharsNeeded = continueReadingLength + 3;

            if (remainingChars >= minCharsNeeded) {
              const availableChars = remainingChars - minCharsNeeded;
              const contentLength = Math.max(1, availableChars);
              content = content.substring(0, contentLength) + "..." + continueReadingText;
            } else if (remainingChars >= continueReadingLength) {
              const availableChars = remainingChars - continueReadingLength;
              const contentLength = Math.max(1, availableChars);
              content = content.substring(0, contentLength) + continueReadingText;
            } else {
              content = content.substring(0, remainingChars - 3) + "...";
            }
          } else {
            content = content.substring(0, remainingChars - 3) + "...";
          }
        }

        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(content));
        currentCharacters += content.length;
        currentComponents += 1;
      } else if (component.type === "mediaGallery") {
        const remainingComponentSlots = MAX_TOTAL_COMPONENTS - currentComponents - 2;
        if (remainingComponentSlots <= 1) break;

        const maxItems = Math.min(component.urls.length, remainingComponentSlots - 1);
        const gallery = new MediaGalleryBuilder();

        for (let j = 0; j < maxItems; j++) {
          gallery.addItems((item) => item.setURL(component.urls[j]));
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

    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent("-# " + footerText));
    currentCharacters += footerText.length;
    currentComponents += 1;

    return container;
  }
}
