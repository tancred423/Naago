import { ContainerBuilder, MediaGalleryBuilder, MessageFlags, time, TimestampStyles } from "discord.js";
import { TopicsRepository } from "../database/repository/TopicsRepository.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";

const MAX_TOTAL_CHARACTERS = 4000;
const MAX_TOTAL_COMPONENTS = 40;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export class EventsCommandHelper {
  public static async getEvents(): Promise<{ components: ContainerBuilder[]; flags: number }> {
    const ongoingEvents = await TopicsRepository.getOngoingEvents();
    const upcomingEvents = await TopicsRepository.getUpcomingEvents();

    const ongoingEmoji = DiscordEmojiService.getAsMarkdown("EMOJI_ARROW_GREEN");
    const upcomingEmoji = DiscordEmojiService.getAsMarkdown("EMOJI_ARROW_YELLOW");

    const containers: ContainerBuilder[] = [];
    let totalCharacters = 0;
    let totalComponents = 0;

    // Container for ongoing events
    const ongoingContainer = new ContainerBuilder().setAccentColor(hexToNumber("#7acc52"));
    const ongoingHeader = `${ongoingEmoji} **Currently Ongoing Events** (${ongoingEvents.length})`;
    ongoingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(ongoingHeader));
    totalCharacters += ongoingHeader.length;
    totalComponents += 1;

    if (ongoingEvents.length > 0) {
      for (const event of ongoingEvents) {
        const titleContent = `### [${event.title}](${event.link})`;
        let dateContent = "";

        const effectiveFrom = event.eventFromOverride ?? event.eventFrom;
        const effectiveTo = event.eventToOverride ?? event.eventTo;

        if ((event.eventType || (event.eventFromOverride && event.eventToOverride)) && effectiveFrom && effectiveTo) {
          const now = Date.now();
          const isAboutToEnd = effectiveTo.getTime() > now && effectiveTo.getTime() <= now + ONE_DAY_MS;
          const fromTimestamp = time(effectiveFrom, TimestampStyles.ShortDateTime);
          const toTimestamp = time(effectiveTo, TimestampStyles.ShortDateTime);
          const fromRelative = time(effectiveFrom, TimestampStyles.RelativeTime);
          const toRelative = time(effectiveTo, TimestampStyles.RelativeTime);
          dateContent = `**From:** ${fromTimestamp} (${fromRelative})\n` +
            `**To:** ${toTimestamp} (${toRelative})` +
            (isAboutToEnd ? " ⚠️ **Ends soon!**" : "");
        } else if (event.timestampLiveLetter) {
          const liveLetterTimestamp = time(event.timestampLiveLetter, TimestampStyles.ShortDateTime);
          const liveLetterRelative = time(event.timestampLiveLetter, TimestampStyles.RelativeTime);
          dateContent = `**Live Letter aired:** ${liveLetterTimestamp} (${liveLetterRelative})`;
        } else {
          continue;
        }

        const eventChars = titleContent.length + dateContent.length;
        const eventComponents = 3 + (event.banner ? 2 : 0);

        if (
          totalCharacters + eventChars > MAX_TOTAL_CHARACTERS ||
          totalComponents + eventComponents > MAX_TOTAL_COMPONENTS
        ) {
          break;
        }

        ongoingContainer.addSeparatorComponents((separator) => separator);
        ongoingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(titleContent));
        totalCharacters += titleContent.length;
        totalComponents += 2;

        if (event.banner) {
          const bannerGallery = new MediaGalleryBuilder().addItems((item) => item.setURL(event.banner));
          ongoingContainer.addMediaGalleryComponents(bannerGallery);
          totalComponents += 2;
        }

        ongoingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(dateContent));
        totalCharacters += dateContent.length;
        totalComponents += 1;
      }
    } else {
      const noEventsText = "No events are currently running.";
      ongoingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(noEventsText));
      totalCharacters += noEventsText.length;
      totalComponents += 1;
    }

    containers.push(ongoingContainer);
    totalComponents += 1;

    // Container for upcoming events
    const upcomingContainer = new ContainerBuilder().setAccentColor(hexToNumber("#ccb233"));
    const upcomingHeader = `${upcomingEmoji} **Upcoming Events** (${upcomingEvents.length})`;
    upcomingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(upcomingHeader));
    totalCharacters += upcomingHeader.length;
    totalComponents += 1;

    if (upcomingEvents.length > 0) {
      for (const event of upcomingEvents) {
        const titleContent = `### [${event.title}](${event.link})`;
        let dateContent = "";

        const effectiveFrom = event.eventFromOverride ?? event.eventFrom;
        const effectiveTo = event.eventToOverride ?? event.eventTo;

        if ((event.eventType || (event.eventFromOverride && event.eventToOverride)) && effectiveFrom && effectiveTo) {
          const fromTimestamp = time(effectiveFrom, TimestampStyles.ShortDateTime);
          const toTimestamp = time(effectiveTo, TimestampStyles.ShortDateTime);
          const fromRelative = time(effectiveFrom, TimestampStyles.RelativeTime);
          const toRelative = time(effectiveTo, TimestampStyles.RelativeTime);
          dateContent = `**From:** ${fromTimestamp} (${fromRelative})\n` +
            `**To:** ${toTimestamp} (${toRelative})`;
        } else if (event.timestampLiveLetter) {
          const liveLetterTimestamp = time(event.timestampLiveLetter, TimestampStyles.ShortDateTime);
          const liveLetterRelative = time(event.timestampLiveLetter, TimestampStyles.RelativeTime);
          dateContent = `**Live Letter airs:** ${liveLetterTimestamp} (${liveLetterRelative})`;
        } else {
          continue;
        }

        const eventChars = titleContent.length + dateContent.length;
        const eventComponents = 3 + (event.banner ? 2 : 0);

        if (
          totalCharacters + eventChars > MAX_TOTAL_CHARACTERS ||
          totalComponents + eventComponents > MAX_TOTAL_COMPONENTS
        ) {
          break;
        }

        upcomingContainer.addSeparatorComponents((separator) => separator);
        upcomingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(titleContent));
        totalCharacters += titleContent.length;
        totalComponents += 2;

        if (event.banner) {
          const bannerGallery = new MediaGalleryBuilder().addItems((item) => item.setURL(event.banner));
          upcomingContainer.addMediaGalleryComponents(bannerGallery);
          totalComponents += 2;
        }

        upcomingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(dateContent));
        totalCharacters += dateContent.length;
        totalComponents += 1;
      }
    } else {
      const noEventsText = "No upcoming events scheduled.";
      upcomingContainer.addTextDisplayComponents((textDisplay) => textDisplay.setContent(noEventsText));
      totalCharacters += noEventsText.length;
      totalComponents += 1;
    }

    containers.push(upcomingContainer);
    totalComponents += 1;

    return { components: containers, flags: MessageFlags.IsComponentsV2 };
  }
}
