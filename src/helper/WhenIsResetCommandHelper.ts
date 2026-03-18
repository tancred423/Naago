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
import { DateHelper } from "./DateHelper.ts";
import { DiscordColorService } from "../service/DiscordColorService.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";
import { PaissaApiService } from "../paissa/service/PaissaApiService.ts";
import { LotteryPhaseInfo } from "../paissa/type/PaissaApiTypes.ts";

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
    const dailyTimestamp = time(DateHelper.toEpochSeconds(dailyReset), TimestampStyles.ShortTime);
    const dailyTimestampRelative = time(DateHelper.toEpochSeconds(dailyReset), TimestampStyles.RelativeTime);

    const dailyAffects = [
      "Allied Society Quest Allowances",
      "Duty Roulette Rewards",
      "+5 Message Book Likes",
      "Mini Cactpot",
    ];

    const gcTimestamp = time(DateHelper.toEpochSeconds(gcReset), TimestampStyles.ShortTime);
    const gcTimestampRelative = time(DateHelper.toEpochSeconds(gcReset), TimestampStyles.RelativeTime);
    const emojiDailyReset = DiscordEmojiService.getAsMarkdown("EMOJI_DAILY_RESET");
    const emojiGrandCompany = DiscordEmojiService.getAsMarkdown("EMOJI_GRAND_COMPANY");
    const emojiLeveQuest = DiscordEmojiService.getAsMarkdown("EMOJI_LEVE_QUEST");
    const emojiCosmicExploration = DiscordEmojiService.getAsMarkdown("EMOJI_COSMIC_EXPLORATION");

    const gcAffects = [
      "Adventurer Squadron Training Allowances",
      "GC Supply and Provision Missions",
    ];

    const levequestTimestamp = time(DateHelper.toEpochSeconds(levequestAllowance), TimestampStyles.FullDateShortTime);
    const levequestTimestampRelative = time(
      DateHelper.toEpochSeconds(levequestAllowance),
      TimestampStyles.RelativeTime,
    );

    const now = new Date();
    let nextMidnight = DateHelper.setUtcTime(now, 0);
    if (now >= nextMidnight) {
      nextMidnight = DateHelper.addDays(nextMidnight, 1);
    }
    let nextNoon = DateHelper.setUtcTime(now, 12);
    if (now >= nextNoon) {
      nextNoon = DateHelper.addDays(nextNoon, 1);
    }

    const midnightTimestamp = time(DateHelper.toEpochSeconds(nextMidnight), TimestampStyles.ShortTime);
    const noonTimestamp = time(DateHelper.toEpochSeconds(nextNoon), TimestampStyles.ShortTime);

    const cosmicExplorationTimestamp = time(DateHelper.toEpochSeconds(cosmicExploration), TimestampStyles.ShortTime);
    const cosmicExplorationTimestampRelative = time(
      DateHelper.toEpochSeconds(cosmicExploration),
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
    const weeklyTimestamp = time(DateHelper.toEpochSeconds(weeklyReset), TimestampStyles.FullDateShortTime);
    const weeklyTimestampRelative = time(DateHelper.toEpochSeconds(weeklyReset), TimestampStyles.RelativeTime);

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

    const fashionTimestamp = time(DateHelper.toEpochSeconds(fashionReport), TimestampStyles.FullDateShortTime);
    const fashionTimestampRelative = time(DateHelper.toEpochSeconds(fashionReport), TimestampStyles.RelativeTime);

    const jumboTimestamp = time(DateHelper.toEpochSeconds(jumboCactpot), TimestampStyles.FullDateShortTime);
    const jumboTimestampRelative = time(DateHelper.toEpochSeconds(jumboCactpot), TimestampStyles.RelativeTime);

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

  static getNextDailyReset(now: Date): Date {
    const todayReset = DateHelper.setUtcTime(now, 15);

    if (now < todayReset) {
      return todayReset;
    } else {
      return DateHelper.addDays(todayReset, 1);
    }
  }

  static getNextGcReset(now: Date): Date {
    const todayReset = DateHelper.setUtcTime(now, 20);

    if (now < todayReset) {
      return todayReset;
    } else {
      return DateHelper.addDays(todayReset, 1);
    }
  }

  static getNextWeeklyReset(now: Date): Date {
    const nextTuesday = DateHelper.setUtcDayOfWeek(now, 2, 8);

    if (now >= nextTuesday) {
      return DateHelper.addWeeks(nextTuesday, 1);
    }

    return nextTuesday;
  }

  static getNextFashionReport(now: Date): Date {
    const nextFriday = DateHelper.setUtcDayOfWeek(now, 5, 8);

    if (now >= nextFriday) {
      return DateHelper.addWeeks(nextFriday, 1);
    }

    return nextFriday;
  }

  static getNextJumboCactpot(now: Date): Date {
    const nextSaturday = DateHelper.setUtcDayOfWeek(now, 6, 20);

    if (now >= nextSaturday) {
      return DateHelper.addWeeks(nextSaturday, 1);
    }

    return nextSaturday;
  }

  static getNextLevequestAllowance(now: Date): Date {
    const todayNoon = DateHelper.setUtcTime(now, 12);
    const tomorrowMidnight = DateHelper.setUtcTime(DateHelper.addDays(now, 1), 0);
    const tomorrowNoon = DateHelper.setUtcTime(DateHelper.addDays(now, 1), 12);

    if (now < todayNoon) {
      return todayNoon;
    } else if (now < tomorrowMidnight) {
      return tomorrowMidnight;
    } else {
      return tomorrowNoon;
    }
  }

  static getNextCosmicExploration(now: Date): Date {
    const todayReset = DateHelper.setUtcTime(now, 9);

    if (now < todayReset) {
      return todayReset;
    } else {
      return DateHelper.addDays(todayReset, 1);
    }
  }
}
