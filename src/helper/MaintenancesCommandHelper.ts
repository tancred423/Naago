import { ContainerBuilder, MessageFlags, time, TimestampStyles } from "discord.js";
import { MaintenancesRepository } from "../database/repository/MaintenancesRepository.ts";
import { MaintenanceData } from "../database/schema/lodestone-news.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";

const MAX_TOTAL_CHARACTERS = 4000;
const MAX_TOTAL_COMPONENTS = 40;

function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function buildMaintenanceDateContent(maintenance: MaintenanceData): string | null {
  if (!maintenance.startDate || !maintenance.endDate) return null;

  const fromTimestamp = time(maintenance.startDate, TimestampStyles.LongDateShortTime);
  const toTimestamp = time(maintenance.endDate, TimestampStyles.LongDateShortTime);
  const fromRelative = time(maintenance.startDate, TimestampStyles.RelativeTime);
  const toRelative = time(maintenance.endDate, TimestampStyles.RelativeTime);

  return `**From:** ${fromTimestamp} (${fromRelative})\n` +
    `**To:** ${toTimestamp} (${toRelative})`;
}

export class MaintenancesCommandHelper {
  public static async getMaintenances(): Promise<{ components: ContainerBuilder[]; flags: number }> {
    const ongoingMaintenances = await MaintenancesRepository.getOngoingMaintenances();
    const upcomingMaintenances = await MaintenancesRepository.getUpcomingMaintenances();

    const ongoingEmoji = DiscordEmojiService.getAsMarkdown("EMOJI_ARROW_GREEN");
    const upcomingEmoji = DiscordEmojiService.getAsMarkdown("EMOJI_ARROW_YELLOW");

    const containers: ContainerBuilder[] = [];
    let totalCharacters = 0;
    let totalComponents = 0;

    const ongoingContainer = new ContainerBuilder().setAccentColor(hexToNumber("#7acc52"));
    const ongoingHeader = `${ongoingEmoji} **Currently Ongoing Maintenances** (${ongoingMaintenances.length})`;
    ongoingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(ongoingHeader));
    totalCharacters += ongoingHeader.length;
    totalComponents += 1;

    if (ongoingMaintenances.length > 0) {
      for (const maintenance of ongoingMaintenances) {
        const titleContent = `### [${maintenance.title}](${maintenance.link})`;
        const dateContent = buildMaintenanceDateContent(maintenance);
        if (!dateContent) continue;

        const tagLine = maintenance.tag && maintenance.tag === "Maintenance: Follow-up" ? `-# Follow-up` : "";
        const itemChars = titleContent.length + dateContent.length + tagLine.length;
        const itemComponents = 3 + (tagLine ? 1 : 0);

        if (
          totalCharacters + itemChars > MAX_TOTAL_CHARACTERS ||
          totalComponents + itemComponents > MAX_TOTAL_COMPONENTS
        ) {
          break;
        }

        ongoingContainer.addSeparatorComponents((separator) => separator);
        ongoingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(titleContent));
        totalCharacters += titleContent.length;
        totalComponents += 2;

        ongoingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(dateContent));
        totalCharacters += dateContent.length;
        totalComponents += 1;

        if (tagLine) {
          ongoingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(tagLine));
          totalCharacters += tagLine.length;
          totalComponents += 1;
        }
      }
    } else {
      const noMaintenancesText = "No maintenances are currently ongoing.";
      ongoingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(noMaintenancesText));
      totalCharacters += noMaintenancesText.length;
      totalComponents += 1;
    }

    containers.push(ongoingContainer);
    totalComponents += 1;

    const upcomingContainer = new ContainerBuilder().setAccentColor(hexToNumber("#ccb233"));
    const upcomingHeader = `${upcomingEmoji} **Upcoming Maintenances** (${upcomingMaintenances.length})`;
    upcomingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(upcomingHeader));
    totalCharacters += upcomingHeader.length;
    totalComponents += 1;

    if (upcomingMaintenances.length > 0) {
      for (const maintenance of upcomingMaintenances) {
        const titleContent = `### [${maintenance.title}](${maintenance.link})`;
        const dateContent = buildMaintenanceDateContent(maintenance);
        if (!dateContent) continue;

        const tagLine = maintenance.tag && maintenance.tag === "Maintenance: Follow-up" ? `-# Follow-up` : "";
        const itemChars = titleContent.length + dateContent.length + tagLine.length;
        const itemComponents = 3 + (tagLine ? 1 : 0);

        if (
          totalCharacters + itemChars > MAX_TOTAL_CHARACTERS ||
          totalComponents + itemComponents > MAX_TOTAL_COMPONENTS
        ) {
          break;
        }

        upcomingContainer.addSeparatorComponents((separator) => separator);
        upcomingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(titleContent));
        totalCharacters += titleContent.length;
        totalComponents += 2;

        upcomingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(dateContent));
        totalCharacters += dateContent.length;
        totalComponents += 1;

        if (tagLine) {
          upcomingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(tagLine));
          totalCharacters += tagLine.length;
          totalComponents += 1;
        }
      }
    } else {
      const noMaintenancesText = "No upcoming maintenances scheduled.";
      upcomingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(noMaintenancesText));
      totalCharacters += noMaintenancesText.length;
      totalComponents += 1;
    }

    containers.push(upcomingContainer);
    totalComponents += 1;

    return { components: containers, flags: MessageFlags.IsComponentsV2 };
  }
}
