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
import moment from "moment";
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
    const now = moment.utc();

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
    dailyReset: moment.Moment,
    gcReset: moment.Moment,
    levequestAllowance: moment.Moment,
    cosmicExploration: moment.Moment,
    color: number,
  ): ContainerBuilder {
    const dailyTimestamp = time(Math.floor(dailyReset.valueOf() / 1000), TimestampStyles.ShortTime);
    const dailyTimestampRelative = time(Math.floor(dailyReset.valueOf() / 1000), TimestampStyles.RelativeTime);

    const dailyAffects = [
      "Allied Society Quest Allowances",
      "Duty Roulette Rewards",
      "+5 Message Book Likes",
      "Mini Cactpot",
    ];

    const gcTimestamp = time(Math.floor(gcReset.valueOf() / 1000), TimestampStyles.ShortTime);
    const gcTimestampRelative = time(Math.floor(gcReset.valueOf() / 1000), TimestampStyles.RelativeTime);
    const emojiDailyReset = DiscordEmojiService.getAsMarkdown("EMOJI_DAILY_RESET");
    const emojiGrandCompany = DiscordEmojiService.getAsMarkdown("EMOJI_GRAND_COMPANY");
    const emojiLeveQuest = DiscordEmojiService.getAsMarkdown("EMOJI_LEVE_QUEST");
    const emojiCosmicExploration = DiscordEmojiService.getAsMarkdown("EMOJI_COSMIC_EXPLORATION");

    const gcAffects = [
      "Adventurer Squadron Training Allowances",
      "GC Supply and Provision Missions",
    ];

    const levequestTimestamp = time(Math.floor(levequestAllowance.valueOf() / 1000), TimestampStyles.FullDateShortTime);
    const levequestTimestampRelative = time(
      Math.floor(levequestAllowance.valueOf() / 1000),
      TimestampStyles.RelativeTime,
    );

    const now = moment.utc();
    const nextMidnight = now.clone().hour(0).minute(0).second(0).millisecond(0);
    if (now.isSameOrAfter(nextMidnight)) {
      nextMidnight.add(1, "day");
    }
    const nextNoon = now.clone().hour(12).minute(0).second(0).millisecond(0);
    if (now.isSameOrAfter(nextNoon)) {
      nextNoon.add(1, "day");
    }

    const midnightTimestamp = time(Math.floor(nextMidnight.valueOf() / 1000), TimestampStyles.ShortTime);
    const noonTimestamp = time(Math.floor(nextNoon.valueOf() / 1000), TimestampStyles.ShortTime);

    const cosmicExplorationTimestamp = time(Math.floor(cosmicExploration.valueOf() / 1000), TimestampStyles.ShortTime);
    const cosmicExplorationTimestampRelative = time(
      Math.floor(cosmicExploration.valueOf() / 1000),
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
    weeklyReset: moment.Moment,
    fashionReport: moment.Moment,
    jumboCactpot: moment.Moment,
    housingLotteryPhase: LotteryPhaseInfo | null,
    color: number,
  ): ContainerBuilder {
    const weeklyTimestamp = time(Math.floor(weeklyReset.valueOf() / 1000), TimestampStyles.FullDateShortTime);
    const weeklyTimestampRelative = time(Math.floor(weeklyReset.valueOf() / 1000), TimestampStyles.RelativeTime);

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

    const fashionTimestamp = time(Math.floor(fashionReport.valueOf() / 1000), TimestampStyles.FullDateShortTime);
    const fashionTimestampRelative = time(Math.floor(fashionReport.valueOf() / 1000), TimestampStyles.RelativeTime);

    const jumboTimestamp = time(Math.floor(jumboCactpot.valueOf() / 1000), TimestampStyles.FullDateShortTime);
    const jumboTimestampRelative = time(Math.floor(jumboCactpot.valueOf() / 1000), TimestampStyles.RelativeTime);

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

  private static getNextDailyReset(now: moment.Moment): moment.Moment {
    const todayReset = now.clone().hour(15).minute(0).second(0).millisecond(0);

    if (now.isBefore(todayReset)) {
      return todayReset;
    } else {
      return todayReset.add(1, "day");
    }
  }

  private static getNextGcReset(now: moment.Moment): moment.Moment {
    const todayReset = now.clone().hour(20).minute(0).second(0).millisecond(0);

    if (now.isBefore(todayReset)) {
      return todayReset;
    } else {
      return todayReset.add(1, "day");
    }
  }

  private static getNextWeeklyReset(now: moment.Moment): moment.Moment {
    const nextTuesday = now.clone().day(2).hour(8).minute(0).second(0).millisecond(0);

    if (now.isSameOrAfter(nextTuesday)) {
      return nextTuesday.add(1, "week");
    }

    return nextTuesday;
  }

  private static getNextFashionReport(now: moment.Moment): moment.Moment {
    const nextFriday = now.clone().day(5).hour(8).minute(0).second(0).millisecond(0);

    if (now.isSameOrAfter(nextFriday)) {
      return nextFriday.add(1, "week");
    }

    return nextFriday;
  }

  private static getNextJumboCactpot(now: moment.Moment): moment.Moment {
    const nextSaturday = now.clone().day(6).hour(20).minute(0).second(0).millisecond(0);

    if (now.isSameOrAfter(nextSaturday)) {
      return nextSaturday.add(1, "week");
    }

    return nextSaturday;
  }

  private static getNextLevequestAllowance(now: moment.Moment): moment.Moment {
    const todayNoon = now.clone().hour(12).minute(0).second(0).millisecond(0);
    const tomorrowMidnight = now.clone().add(1, "day").hour(0).minute(0).second(0).millisecond(0);
    const tomorrowNoon = now.clone().add(1, "day").hour(12).minute(0).second(0).millisecond(0);

    if (now.isBefore(todayNoon)) {
      return todayNoon;
    } else if (now.isBefore(tomorrowMidnight)) {
      return tomorrowMidnight;
    } else {
      return tomorrowNoon;
    }
  }

  private static getNextCosmicExploration(now: moment.Moment): moment.Moment {
    const todayReset = now.clone().hour(9).minute(0).second(0).millisecond(0);

    if (now.isBefore(todayReset)) {
      return todayReset;
    } else {
      return todayReset.add(1, "day");
    }
  }
}
