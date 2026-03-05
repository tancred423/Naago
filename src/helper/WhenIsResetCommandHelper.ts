import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  ContainerBuilder,
  MessageFlags,
  resolveColor,
  SectionBuilder,
  time,
  TimestampStyles,
} from "discord.js";
import { getUnixTime } from "date-fns";
import { DiscordColorService } from "../service/DiscordColorService.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";
import { PaissaApiService } from "../paissa/service/PaissaApiService.ts";
import { LotteryPhaseInfo } from "../paissa/type/PaissaApiTypes.ts";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

function utcToday(now: Date, hours: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, 0, 0, 0));
}

type Page = "daily" | "weekly";

export class WhenIsResetCommandHelper {
  public static async handlePageSwapButton(
    interaction: ButtonInteraction,
    buttonIdSplit: string[],
  ): Promise<void> {
    const page = buttonIdSplit[1] as Page;
    const reply = await this.getPage(interaction, page);
    await interaction.editReply(reply);
  }

  public static async getPage(
    interaction: ButtonInteraction | CommandInteraction,
    page: Page = "daily",
  ): Promise<{ content: string; components: (ContainerBuilder | ActionRowBuilder<ButtonBuilder>)[]; flags: number }> {
    const botColorResolvable = await DiscordColorService.getBotColorByInteraction(interaction);
    const color = resolveColor(botColorResolvable);
    const now = new Date();

    const components: (ContainerBuilder | ActionRowBuilder<ButtonBuilder>)[] = [];

    if (page === "daily") {
      const nextDailyReset = this.getNextDailyReset(now);
      const nextGcReset = this.getNextGcReset(now);
      const nextLevequestAllowance = this.getNextLevequestAllowance(now);
      const nextCosmicExploration = this.getNextCosmicExploration(now);
      components.push(
        this.buildDailyContainer(nextDailyReset, nextGcReset, nextLevequestAllowance, nextCosmicExploration, color),
      );
    } else {
      const nextWeeklyReset = this.getNextWeeklyReset(now);
      const nextFashionReport = this.getNextFashionReport(now);
      const nextJumboCactpot = this.getNextJumboCactpot(now);
      const housingLotteryPhase = await PaissaApiService.getCurrentLotteryPhase();
      components.push(
        this.buildWeeklyContainer(nextWeeklyReset, nextFashionReport, nextJumboCactpot, housingLotteryPhase, color),
      );
    }

    components.push(this.buildButtons(page));

    return {
      content: "",
      components,
      flags: MessageFlags.IsComponentsV2,
    };
  }

  private static buildButtons(currentPage: Page): ActionRowBuilder<ButtonBuilder> {
    const dailyButton = new ButtonBuilder()
      .setCustomId("whenisreset.daily")
      .setLabel("Daily Resets")
      .setStyle(currentPage === "daily" ? ButtonStyle.Primary : ButtonStyle.Secondary);

    const weeklyButton = new ButtonBuilder()
      .setCustomId("whenisreset.weekly")
      .setLabel("Weekly Resets")
      .setStyle(currentPage === "weekly" ? ButtonStyle.Primary : ButtonStyle.Secondary);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(dailyButton, weeklyButton);
  }

  private static buildDailyContainer(
    dailyReset: Date,
    gcReset: Date,
    levequestAllowance: Date,
    cosmicExploration: Date,
    color: number,
  ): ContainerBuilder {
    const dailyTimestamp = time(getUnixTime(dailyReset), TimestampStyles.ShortTime);
    const dailyTimestampRelative = time(getUnixTime(dailyReset), TimestampStyles.RelativeTime);

    const dailyAffects = [
      "Allied Society Quest Allowances",
      "Duty Roulette Rewards",
      "+5 Message Book Likes",
      "Mini Cactpot",
    ];

    const gcTimestamp = time(getUnixTime(gcReset), TimestampStyles.ShortTime);
    const gcTimestampRelative = time(getUnixTime(gcReset), TimestampStyles.RelativeTime);
    const emojiDailyReset = DiscordEmojiService.getAsMarkdown("EMOJI_DAILY_RESET");
    const emojiGrandCompany = DiscordEmojiService.getAsMarkdown("EMOJI_GRAND_COMPANY");
    const emojiLeveQuest = DiscordEmojiService.getAsMarkdown("EMOJI_LEVE_QUEST");
    const emojiCosmicExploration = DiscordEmojiService.getAsMarkdown("EMOJI_COSMIC_EXPLORATION");

    const gcAffects = [
      "Adventurer Squadron Training Allowances",
      "GC Supply and Provision Missions",
    ];

    const levequestTimestamp = time(getUnixTime(levequestAllowance), TimestampStyles.FullDateShortTime);
    const levequestTimestampRelative = time(
      getUnixTime(levequestAllowance),
      TimestampStyles.RelativeTime,
    );

    const now = new Date();
    let nextMidnight = utcToday(now, 0);
    if (now >= nextMidnight) {
      nextMidnight = new Date(nextMidnight.getTime() + DAY_MS);
    }
    let nextNoon = utcToday(now, 12);
    if (now >= nextNoon) {
      nextNoon = new Date(nextNoon.getTime() + DAY_MS);
    }

    const midnightTimestamp = time(getUnixTime(nextMidnight), TimestampStyles.ShortTime);
    const noonTimestamp = time(getUnixTime(nextNoon), TimestampStyles.ShortTime);

    const cosmicExplorationTimestamp = time(getUnixTime(cosmicExploration), TimestampStyles.ShortTime);
    const cosmicExplorationTimestampRelative = time(
      getUnixTime(cosmicExploration),
      TimestampStyles.RelativeTime,
    );

    const ceAffects = [
      "Objectives",
      "Success Points",
    ];

    return new ContainerBuilder()
      .setAccentColor(color)
      .addTextDisplayComponents((text) => text.setContent(`### ${emojiDailyReset} Daily Reset`))
      .addTextDisplayComponents((text) => text.setContent(`**Daily at ${dailyTimestamp} (${dailyTimestampRelative})**`))
      .addTextDisplayComponents((text) => text.setContent(`${dailyAffects.map((a) => `• ${a}`).join("\n")}`))
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) => text.setContent(`### ${emojiGrandCompany} Daily Grand Company Reset`))
      .addTextDisplayComponents((text) => text.setContent(`**Daily at ${gcTimestamp} (${gcTimestampRelative})**`))
      .addTextDisplayComponents((text) => text.setContent(`${gcAffects.map((a) => `• ${a}`).join("\n")}`))
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) => text.setContent(`### ${emojiCosmicExploration} Cosmic Exploration`))
      .addTextDisplayComponents((text) =>
        text.setContent(`**Daily at ${cosmicExplorationTimestamp} (${cosmicExplorationTimestampRelative})**`)
      )
      .addTextDisplayComponents((text) => text.setContent(`${ceAffects.map((a) => `• ${a}`).join("\n")}`))
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) => text.setContent(`### ${emojiLeveQuest} Levequest Allowances`))
      .addTextDisplayComponents((text) =>
        text.setContent(`**Next: ${levequestTimestamp} (${levequestTimestampRelative})**`)
      )
      .addTextDisplayComponents((text) =>
        text.setContent(`• +3 allowances every 12 hours at ${midnightTimestamp} and ${noonTimestamp}.`)
      );
  }

  private static buildWeeklyContainer(
    weeklyReset: Date,
    fashionReport: Date,
    jumboCactpot: Date,
    housingLotteryPhase: LotteryPhaseInfo | null,
    color: number,
  ): ContainerBuilder {
    const weeklyTimestamp = time(getUnixTime(weeklyReset), TimestampStyles.FullDateShortTime);
    const weeklyTimestampRelative = time(getUnixTime(weeklyReset), TimestampStyles.RelativeTime);

    const weeklyAffects = [
      "Adventurer Squadron Priority Missions",
      "Challenge Logs",
      "Custom Deliveries",
      "Doman Enclave Reconstruction Donations",
      "Faux Hollows",
      "Masked Carnivale Weekly Targets",
      "Tomestone Cap",
      "Weekly-capped instance loot (New Savage, Ultimate and Alliance Raids)",
      "Wondrous Tails Journal",
    ];

    const fashionTimestamp = time(getUnixTime(fashionReport), TimestampStyles.FullDateShortTime);
    const fashionTimestampRelative = time(getUnixTime(fashionReport), TimestampStyles.RelativeTime);

    const jumboTimestamp = time(getUnixTime(jumboCactpot), TimestampStyles.FullDateShortTime);
    const jumboTimestampRelative = time(getUnixTime(jumboCactpot), TimestampStyles.RelativeTime);

    const emojiWeeklyReset = DiscordEmojiService.getAsMarkdown("EMOJI_WEEKLY_RESET");
    const emojiFashionReport = DiscordEmojiService.getAsMarkdown("EMOJI_FASHION_REPORT");
    const emojiMGP = DiscordEmojiService.getAsMarkdown("EMOJI_MGP");
    const emojiPaissaHouse = DiscordEmojiService.getAsMarkdown("EMOJI_PAISSA_HOUSE");

    let housingTitle: string;
    let housingContent: string;

    if (housingLotteryPhase && housingLotteryPhase.isCurrent) {
      const housingTimestamp = time(housingLotteryPhase.until, TimestampStyles.FullDateShortTime);
      const housingTimestampRelative = time(housingLotteryPhase.until, TimestampStyles.RelativeTime);
      housingTitle = `### ${emojiPaissaHouse} Housing Lottery`;
      housingContent =
        `**${housingLotteryPhase.phaseName} Phase ends ${housingTimestamp} (${housingTimestampRelative})**`;
    } else {
      housingTitle = `### ${emojiPaissaHouse} Housing Lottery Phase`;
      housingContent = `Information about the next phase are currently unavailable.`;
    }

    const islandSanctuarySection = new SectionBuilder()
      .addTextDisplayComponents((text) =>
        text.setContent(
          `• Optimally, Island Sanctuary should also be updated on this day. More information can be found on the Overseas Casuals Discord server.`,
        )
      )
      .setButtonAccessory((button) =>
        button.setURL("https://discord.gg/overseascasuals").setStyle(ButtonStyle.Link).setLabel("Join Overseas Casuals")
      );

    const fashionReportSection = new SectionBuilder()
      .addTextDisplayComponents((text) =>
        text.setContent(`Discussions and suggestions can be found in the Fashion Reporter Discord server.`)
      )
      .setButtonAccessory((button) =>
        button.setURL("https://discord.kaiyoko.org/").setStyle(ButtonStyle.Link).setLabel("Join Fashion Reporter")
      );

    const paissaHouseSection = new SectionBuilder()
      .addTextDisplayComponents((text) => text.setContent(`Check out my housing Discord bot "PaissaHouse".`))
      .setButtonAccessory((button) =>
        button.setURL("https://paissa.tancred.de").setStyle(ButtonStyle.Link).setLabel("Visit PaissaHouse")
      );

    const paissaDbSection = new SectionBuilder()
      .addTextDisplayComponents((text) => text.setContent(`The Discord bot "PaissaHouse" is based on Zhu's PaissaDB.`))
      .setButtonAccessory((button) =>
        button.setURL("https://zhu.codes/paissa").setStyle(ButtonStyle.Link).setLabel("Visit PaissaDB")
      );

    return new ContainerBuilder()
      .setAccentColor(color)
      .addTextDisplayComponents((text) => text.setContent(`### ${emojiWeeklyReset} Weekly Reset`))
      .addTextDisplayComponents((text) => text.setContent(`**Next: ${weeklyTimestamp} (${weeklyTimestampRelative})**`))
      .addTextDisplayComponents((text) => text.setContent(`${weeklyAffects.map((a) => `• ${a}`).join("\n")}`))
      .addSectionComponents(islandSanctuarySection)
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) => text.setContent(`### ${emojiFashionReport} Fashion Report`))
      .addTextDisplayComponents((text) =>
        text.setContent(`**Next: ${fashionTimestamp} (${fashionTimestampRelative})**`)
      )
      .addSectionComponents(fashionReportSection)
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) => text.setContent(`### ${emojiMGP} Jumbo Cactpot`))
      .addTextDisplayComponents((text) => text.setContent(`**Next: ${jumboTimestamp} (${jumboTimestampRelative})**`))
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) => text.setContent(housingTitle))
      .addTextDisplayComponents((text) => text.setContent(housingContent))
      .addSectionComponents(paissaHouseSection)
      .addSectionComponents(paissaDbSection);
  }

  private static getNextDailyReset(now: Date): Date {
    const todayReset = utcToday(now, 15);
    return now < todayReset ? todayReset : new Date(todayReset.getTime() + DAY_MS);
  }

  private static getNextGcReset(now: Date): Date {
    const todayReset = utcToday(now, 20);
    return now < todayReset ? todayReset : new Date(todayReset.getTime() + DAY_MS);
  }

  private static getNextWeeklyReset(now: Date): Date {
    const diff = 2 - now.getUTCDay();
    const nextTuesday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + diff,
      8,
      0,
      0,
      0,
    ));
    return now >= nextTuesday ? new Date(nextTuesday.getTime() + WEEK_MS) : nextTuesday;
  }

  private static getNextFashionReport(now: Date): Date {
    const diff = 5 - now.getUTCDay();
    const nextFriday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + diff,
      8,
      0,
      0,
      0,
    ));
    return now >= nextFriday ? new Date(nextFriday.getTime() + WEEK_MS) : nextFriday;
  }

  private static getNextJumboCactpot(now: Date): Date {
    const diff = 6 - now.getUTCDay();
    const nextSaturday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + diff,
      20,
      0,
      0,
      0,
    ));
    return now >= nextSaturday ? new Date(nextSaturday.getTime() + WEEK_MS) : nextSaturday;
  }

  private static getNextLevequestAllowance(now: Date): Date {
    const todayNoon = utcToday(now, 12);
    const tomorrowMidnight = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ));
    const tomorrowNoon = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      12,
      0,
      0,
      0,
    ));

    if (now < todayNoon) return todayNoon;
    if (now < tomorrowMidnight) return tomorrowMidnight;
    return tomorrowNoon;
  }

  private static getNextCosmicExploration(now: Date): Date {
    const todayReset = utcToday(now, 9);
    return now < todayReset ? todayReset : new Date(todayReset.getTime() + DAY_MS);
  }
}
