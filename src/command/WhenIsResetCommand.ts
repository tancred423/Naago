import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  MessageFlags,
  resolveColor,
  SlashCommandBuilder,
  time,
  TimestampStyles,
} from "discord.js";
import { Command } from "./type/Command.ts";
import moment from "moment";
import { DiscordColorService } from "../service/DiscordColorService.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";
import { PaissaApiService } from "../paissa/service/PaissaApiService.ts";
import { LotteryPhaseInfo } from "../paissa/type/PaissaApiTypes.ts";

class WhenIsResetCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("when-is-reset")
    .setDescription("Shows different reset times for FFXIV.");

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const botColorResolvable = await DiscordColorService.getBotColorByInteraction(interaction);
    const color = resolveColor(botColorResolvable);
    const now = moment.utc();

    const nextDailyReset = this.getNextDailyReset(now);
    const nextGcReset = this.getNextGcReset(now);
    const nextWeeklyReset = this.getNextWeeklyReset(now);
    const nextFashionReport = this.getNextFashionReport(now);
    const nextJumboCactpot = this.getNextJumboCactpot(now);
    const housingLotteryPhase = await PaissaApiService.getCurrentLotteryPhase();

    const containers: ContainerBuilder[] = [];

    containers.push(this.buildDailyContainer(nextDailyReset, nextGcReset, color));
    containers.push(
      this.buildWeeklyContainer(nextWeeklyReset, nextFashionReport, nextJumboCactpot, housingLotteryPhase, color),
    );

    await interaction.editReply({
      components: containers,
      flags: MessageFlags.IsComponentsV2,
    });
  }

  private buildDailyContainer(dailyReset: moment.Moment, gcReset: moment.Moment, color: number): ContainerBuilder {
    const dailyTimestampShortTime = time(Math.floor(dailyReset.valueOf() / 1000), TimestampStyles.ShortTime);
    const dailyTimestampRelative = time(Math.floor(dailyReset.valueOf() / 1000), TimestampStyles.RelativeTime);

    const dailyAffects = [
      "Allied Society quest allowances",
      "Daily repeatable quests",
      "Duty Roulette rewards",
      "+5 Message Book likes",
      "Mini Cactpot",
      "The Hunt bounties",
    ];

    const gcTimestampShortTime = time(Math.floor(gcReset.valueOf() / 1000), TimestampStyles.ShortTime);
    const gcTimestampRelative = time(Math.floor(gcReset.valueOf() / 1000), TimestampStyles.RelativeTime);
    const emojiDailyReset = DiscordEmojiService.getAsMarkdown("EMOJI_DAILY_RESET");
    const emojiGrandCompany = DiscordEmojiService.getAsMarkdown("EMOJI_GRAND_COMPANY");

    const gcAffects = [
      "Adventurer Squadron training allowances",
      "GC Supply and Provision Missions",
    ];

    return new ContainerBuilder()
      .setAccentColor(color)
      .addTextDisplayComponents((text) =>
        text.setContent(`### ${emojiDailyReset} Daily reset at ${dailyTimestampShortTime} (${dailyTimestampRelative})`)
      )
      .addTextDisplayComponents((text) => text.setContent(`${dailyAffects.map((a) => `• ${a}`).join("\n")}`))
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) =>
        text.setContent(
          `### ${emojiGrandCompany} Daily Grand Company reset at ${gcTimestampShortTime} (${gcTimestampRelative})`,
        )
      )
      .addTextDisplayComponents((text) => text.setContent(`${gcAffects.map((a) => `• ${a}`).join("\n")}`));
  }

  private buildWeeklyContainer(
    weeklyReset: moment.Moment,
    fashionReport: moment.Moment,
    jumboCactpot: moment.Moment,
    housingLotteryPhase: LotteryPhaseInfo | null,
    color: number,
  ): ContainerBuilder {
    const weeklyTimestampShortTime = time(Math.floor(weeklyReset.valueOf() / 1000), TimestampStyles.ShortTime);
    const weeklyTimestampRelative = time(Math.floor(weeklyReset.valueOf() / 1000), TimestampStyles.RelativeTime);

    const weeklyAffects = [
      "Adventurer Squadron Priority Missions",
      "Challenge Logs",
      "Custom Deliveries",
      "Doman Enclave Reconstruction Effort donations",
      "Faux Hollows availability",
      "Masked Carnivale weekly targets",
      "Tomestone acquisition caps",
      "Weekly capped instance loot (e.g. Savage raids or Alliance raids)",
      "Wondrous Tails journal",
    ];

    const fashionTimestampShortTime = time(Math.floor(fashionReport.valueOf() / 1000), TimestampStyles.ShortTime);
    const fashionTimestampRelative = time(Math.floor(fashionReport.valueOf() / 1000), TimestampStyles.RelativeTime);

    const jumboTimestampShortTime = time(Math.floor(jumboCactpot.valueOf() / 1000), TimestampStyles.ShortTime);
    const jumboTimestampRelative = time(Math.floor(jumboCactpot.valueOf() / 1000), TimestampStyles.RelativeTime);

    const emojiWeeklyReset = DiscordEmojiService.getAsMarkdown("EMOJI_WEEKLY_RESET");
    const emojiFashionReport = DiscordEmojiService.getAsMarkdown("EMOJI_FASHION_REPORT");
    const emojiMGP = DiscordEmojiService.getAsMarkdown("EMOJI_MGP");
    const emojiPaissaHouse = DiscordEmojiService.getAsMarkdown("EMOJI_PAISSA_HOUSE");

    let housingTitle: string;
    let housingContent: string;

    if (housingLotteryPhase && housingLotteryPhase.isCurrent) {
      const housingTimestampFull = time(housingLotteryPhase.until, TimestampStyles.LongDateTime);
      const housingTimestampRelative = time(housingLotteryPhase.until, TimestampStyles.RelativeTime);
      housingTitle = `### ${emojiPaissaHouse} Housing Lottery`;
      housingContent =
        `**${housingLotteryPhase.phaseName} Phase ends ${housingTimestampFull} (${housingTimestampRelative})**`;
    } else {
      housingTitle = `### ${emojiPaissaHouse} Housing Lottery`;
      housingContent = `Information about the lottery phase are currently unavailable.`;
    }

    return new ContainerBuilder()
      .setAccentColor(color)
      .addTextDisplayComponents((text) =>
        text.setContent(
          `### ${emojiWeeklyReset} Weekly reset every Tuesday at ${weeklyTimestampShortTime} (${weeklyTimestampRelative})`,
        )
      )
      .addTextDisplayComponents((text) => text.setContent(`${weeklyAffects.map((a) => `• ${a}`).join("\n")}`))
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) =>
        text.setContent(
          `### ${emojiFashionReport} Fashion Report every Friday from ${fashionTimestampShortTime} (${fashionTimestampRelative})`,
        )
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) =>
        text.setContent(
          `### ${emojiMGP} Jumbo Cactpot every Saturday from ${jumboTimestampShortTime} (${jumboTimestampRelative})`,
        )
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) => text.setContent(housingTitle))
      .addTextDisplayComponents((text) => text.setContent(housingContent))
      .addTextDisplayComponents((text) =>
        text.setContent(
          `• Check out my [housing Discord bot "PaissaHouse"](https://paissa.tancred.de) for more detailed housing information.\n• The PaissaHouse Discord bot is based on [Zhu](https://github.com/zhudotexe)'s [PaissaDB](https://zhu.codes/paissa).`,
        )
      );
  }

  private getNextDailyReset(now: moment.Moment): moment.Moment {
    const todayReset = now.clone().hour(15).minute(0).second(0).millisecond(0);

    if (now.isBefore(todayReset)) {
      return todayReset;
    } else {
      return todayReset.add(1, "day");
    }
  }

  private getNextGcReset(now: moment.Moment): moment.Moment {
    const todayReset = now.clone().hour(20).minute(0).second(0).millisecond(0);

    if (now.isBefore(todayReset)) {
      return todayReset;
    } else {
      return todayReset.add(1, "day");
    }
  }

  private getNextWeeklyReset(now: moment.Moment): moment.Moment {
    const nextTuesday = now.clone().day(2).hour(8).minute(0).second(0).millisecond(0);

    if (now.isSameOrAfter(nextTuesday)) {
      return nextTuesday.add(1, "week");
    }

    return nextTuesday;
  }

  private getNextFashionReport(now: moment.Moment): moment.Moment {
    const nextFriday = now.clone().day(5).hour(8).minute(0).second(0).millisecond(0);

    if (now.isSameOrAfter(nextFriday)) {
      return nextFriday.add(1, "week");
    }

    return nextFriday;
  }

  private getNextJumboCactpot(now: moment.Moment): moment.Moment {
    const nextSaturday = now.clone().day(6).hour(20).minute(0).second(0).millisecond(0);

    if (now.isSameOrAfter(nextSaturday)) {
      return nextSaturday.add(1, "week");
    }

    return nextSaturday;
  }
}

export default new WhenIsResetCommand();
