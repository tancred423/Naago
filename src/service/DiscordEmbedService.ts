import {
  ColorResolvable,
  ContainerBuilder,
  EmbedBuilder,
  MediaGalleryBuilder,
  time,
  TimestampStyles,
} from "discord.js";
import { MaintenanceData, TopicData } from "../database/schema/lodestone-news.ts";
import { DiscordComponentsV2 } from "../naagostone/type/DiscordComponentsV2.ts";

const green = Deno.env.get("COLOR_GREEN")!;
const red = Deno.env.get("COLOR_RED")!;

const MAX_DESCRIPTION_LENGTH = 2000;

function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export class DiscordEmbedService {
  public static getSuccessEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(green as ColorResolvable)
      .setDescription(message);
  }

  public static getErrorEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(red as ColorResolvable)
      .setDescription(message);
  }

  public static buildTextContainer(text: string, colorEnvKey: string): ContainerBuilder {
    const colorHex = Deno.env.get(colorEnvKey) ?? "#000000";
    const container = new ContainerBuilder().setAccentColor(hexToNumber(colorHex));
    container.addTextDisplayComponents((td) => td.setContent(text));
    return container;
  }

  public static getTopicContainerFromData(topic: TopicData): ContainerBuilder {
    const colorHex = Deno.env.get("COLOR_TOPICS")!;
    const newsEmoji = Deno.env.get("EMOJI_NEWS_TOPIC") ?? "";
    const lodestoneEmoji = Deno.env.get("EMOJI_LODESTONE") ?? "";

    const container = new ContainerBuilder().setAccentColor(hexToNumber(colorHex));

    container.addTextDisplayComponents((td) => td.setContent(`${newsEmoji}  **Topic**`));
    container.addTextDisplayComponents((td) => td.setContent(`### [${topic.title}](${topic.link})`));

    if (topic.banner) {
      const gallery = new MediaGalleryBuilder().addItems((item) => item.setURL(topic.banner));
      container.addMediaGalleryComponents(gallery);
    }

    this.addDescription(container, topic.description, topic.descriptionV2, topic.link);

    container.addSeparatorComponents((s) => s);
    const footer = `${lodestoneEmoji}  Lodestone · ${
      time(Math.floor(topic.date.getTime() / 1000), TimestampStyles.ShortDateTime)
    }`;
    container.addTextDisplayComponents((td) => td.setContent("-# " + footer));

    return container;
  }

  public static getMaintenanceContainerFromData(maintenance: MaintenanceData): ContainerBuilder {
    const colorHex = Deno.env.get("COLOR_MAINTENANCES")!;
    const newsEmoji = Deno.env.get("EMOJI_NEWS_MAINTENANCE") ?? "";
    const lodestoneEmoji = Deno.env.get("EMOJI_LODESTONE") ?? "";

    const container = new ContainerBuilder().setAccentColor(hexToNumber(colorHex));

    const typeLabel = maintenance.tag ?? "Maintenance";
    container.addTextDisplayComponents((td) => td.setContent(`${newsEmoji}  **${typeLabel}**`));
    container.addTextDisplayComponents((td) => td.setContent(`### [${maintenance.title}](${maintenance.link})`));

    this.addDescription(container, maintenance.description, maintenance.descriptionV2, maintenance.link);

    container.addSeparatorComponents((s) => s);
    const footer = `${lodestoneEmoji}  Lodestone · ${
      time(Math.floor(maintenance.date.getTime() / 1000), TimestampStyles.ShortDateTime)
    }`;
    container.addTextDisplayComponents((td) => td.setContent("-# " + footer));

    return container;
  }

  private static addDescription(
    container: ContainerBuilder,
    markdown: string,
    descriptionV2: DiscordComponentsV2 | null,
    link: string,
  ): void {
    if (descriptionV2?.components?.length) {
      for (const component of descriptionV2.components) {
        if (component.type === "textDisplay") {
          container.addTextDisplayComponents((td) => td.setContent(component.content));
        } else if (component.type === "mediaGallery") {
          const gallery = new MediaGalleryBuilder();
          for (const url of component.urls) {
            gallery.addItems((item) => item.setURL(url));
          }
          container.addMediaGalleryComponents(gallery);
        } else if (component.type === "separator") {
          container.addSeparatorComponents((s) => s);
        }
      }
    } else {
      let desc = markdown;
      if (desc.length > MAX_DESCRIPTION_LENGTH) {
        const truncateAt = MAX_DESCRIPTION_LENGTH - 30;
        desc = desc.substring(0, truncateAt) + `...\n\n[*Continue Reading*](${link})`;
      }
      container.addTextDisplayComponents((td) => td.setContent(desc));
    }
  }
}
