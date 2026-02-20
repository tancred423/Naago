import {
  ChatInputCommandInteraction,
  codeBlock,
  MessageFlags,
  PermissionsBitField,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { Command } from "./type/Command.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { NewsQueueProcessor } from "../service/NewsQueueProcessor.ts";
import { InvalidSubCommandError } from "./error/InvalidSubCommandError.ts";
import { GlobalClient } from "../GlobalClient.ts";
import { PostedNewsMessagesRepository } from "../database/repository/PostedNewsMessagesRepository.ts";
import { TopicsRepository } from "../database/repository/TopicsRepository.ts";
import { inspect } from "node:util";
import * as log from "@std/log";

const OWNER_COMMANDS_USER_ID = Deno.env.get("OWNER_COMMANDS_USER_ID");

const DISCORD_MESSAGE_URL_REGEX = /^https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)$/;
const DATETIME_REGEX = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;

class OwnerCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("owner")
    .setDescription("Owner-only commands.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("queue-stats")
        .setDescription("View queue statistics.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("eval")
        .setDescription("Evaluate JavaScript code.")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("The code to evaluate.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add-event-override")
        .setDescription("Manually set event time frame for a topic.")
        .addStringOption((option) =>
          option
            .setName("url")
            .setDescription("Discord message URL of the topic news.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("event-start")
            .setDescription("Event start in UTC (yyyy-MM-dd HH:mm).")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("event-end")
            .setDescription("Event end in UTC (yyyy-MM-dd HH:mm).")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove-event-override")
        .setDescription("Remove manual event time override from a topic.")
        .addStringOption((option) =>
          option
            .setName("url")
            .setDescription("Discord message URL of the topic news.")
            .setRequired(true)
        )
    ) as SlashCommandSubcommandsOnlyBuilder;

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!OWNER_COMMANDS_USER_ID || interaction.user.id !== OWNER_COMMANDS_USER_ID) {
      const embed = DiscordEmbedService.getErrorEmbed("You do not have permission to use this command.");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "queue-stats":
        await this.handleQueueStats(interaction);
        break;
      case "eval":
        await this.handleEval(interaction);
        break;
      case "add-event-override":
        await this.handleAddEvent(interaction);
        break;
      case "remove-event-override":
        await this.handleRemoveEvent(interaction);
        break;
      default:
        throw new InvalidSubCommandError(`/owner ${subCommand}`);
    }
  }

  private async handleQueueStats(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const stats = await NewsQueueProcessor.getStats();

      const embed = DiscordEmbedService.getSuccessEmbed("Queue Statistics")
        .addFields([
          {
            name: "Pending Jobs",
            value: stats.pending.toString(),
            inline: true,
          },
          {
            name: "Processing Jobs",
            value: stats.processing.toString(),
            inline: true,
          },
          {
            name: "Completed Jobs",
            value: stats.completed.toString(),
            inline: true,
          },
          {
            name: "Failed Jobs",
            value: stats.failed.toString(),
            inline: true,
          },
        ]);

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (error: unknown) {
      const embed = DiscordEmbedService.getErrorEmbed("An error occurred while fetching queue statistics.");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      log.error(`Failed to get queue stats: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  private async handleEval(interaction: ChatInputCommandInteraction): Promise<void> {
    const code = interaction.options.getString("code", true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const startTime = performance.now();
    let result: unknown;
    let success = true;

    const client = GlobalClient.client;
    const guild = interaction.guild;
    const channel = interaction.channel;
    const user = interaction.user;

    void client;
    void guild;
    void channel;
    void user;

    try {
      result = await eval(`(async () => { return ${code} })()`);
    } catch (error: unknown) {
      success = false;
      result = error;
    }

    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);

    const output = this.formatEvalOutput(result, success);
    const cleanOutput = this.cleanSensitiveData(output);
    const truncatedOutput = this.truncateOutput(cleanOutput, 4000);

    const embed = success
      ? DiscordEmbedService.getSuccessEmbed("Eval Result")
      : DiscordEmbedService.getErrorEmbed("Eval Error");

    embed.setDescription(codeBlock("js", truncatedOutput));
    embed.setFooter({ text: `Executed in ${executionTime}ms` });

    await interaction.editReply({ embeds: [embed] });
  }

  private parseUtcDatetime(input: string): Date | null {
    const match = input.match(DATETIME_REGEX);
    if (!match) return null;

    const [, year, month, day, hour, minute] = match;
    const date = new Date(Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
    ));

    if (isNaN(date.getTime())) return null;
    return date;
  }

  private async resolveTopicFromUrl(
    interaction: ChatInputCommandInteraction,
    url: string,
  ): Promise<{ guildId: string; channelId: string; messageId: string; topicId: number; topicTitle: string } | null> {
    const urlMatch = url.match(DISCORD_MESSAGE_URL_REGEX);
    if (!urlMatch) {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Invalid URL format. Expected: `https://discord.com/channels/<guild_id>/<channel_id>/<message_id>`",
      );
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return null;
    }

    const [, guildId, channelId, messageId] = urlMatch;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const postedMessage = await PostedNewsMessagesRepository.findByMessage(guildId, channelId, messageId, "topics");
    if (!postedMessage) {
      const embed = DiscordEmbedService.getErrorEmbed("No topics news found for the provided message URL.");
      await interaction.editReply({ embeds: [embed] });
      return null;
    }

    const topic = await TopicsRepository.findById(postedMessage.newsId);
    if (!topic) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `Topic with ID ${postedMessage.newsId} not found in the database.`,
      );
      await interaction.editReply({ embeds: [embed] });
      return null;
    }

    return { guildId, channelId, messageId, topicId: topic.id, topicTitle: topic.title };
  }

  private async handleAddEvent(interaction: ChatInputCommandInteraction): Promise<void> {
    const url = interaction.options.getString("url", true);
    const eventStartRaw = interaction.options.getString("event-start", true);
    const eventEndRaw = interaction.options.getString("event-end", true);

    const eventFromDate = this.parseUtcDatetime(eventStartRaw);
    const eventToDate = this.parseUtcDatetime(eventEndRaw);

    if (!eventFromDate || !eventToDate) {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Invalid date format. Expected: `yyyy-MM-dd HH:mm` in UTC.",
      );
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    if (eventFromDate.getTime() >= eventToDate.getTime()) {
      const embed = DiscordEmbedService.getErrorEmbed("Event start must be before event end.");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    try {
      const resolved = await this.resolveTopicFromUrl(interaction, url);
      if (!resolved) return;

      await TopicsRepository.updateEventOverride(resolved.topicId, eventFromDate, eventToDate);

      const startUnix = Math.floor(eventFromDate.getTime() / 1000);
      const endUnix = Math.floor(eventToDate.getTime() / 1000);

      const embed = DiscordEmbedService.getSuccessEmbed("Event Override Set")
        .addFields([
          { name: "Topic", value: resolved.topicTitle, inline: false },
          { name: "Event Start", value: `<t:${startUnix}:F> (<t:${startUnix}:R>)`, inline: true },
          { name: "Event End", value: `<t:${endUnix}:F> (<t:${endUnix}:R>)`, inline: true },
        ]);

      await interaction.editReply({ embeds: [embed] });
      log.info(`[OWNER] Event override set for topic "${resolved.topicTitle}" (ID: ${resolved.topicId})`);
    } catch (error: unknown) {
      const embed = DiscordEmbedService.getErrorEmbed("An error occurred while setting the event override.");
      await interaction.editReply({ embeds: [embed] });
      log.error(`Failed to set event override: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  private async handleRemoveEvent(interaction: ChatInputCommandInteraction): Promise<void> {
    const url = interaction.options.getString("url", true);

    try {
      const resolved = await this.resolveTopicFromUrl(interaction, url);
      if (!resolved) return;

      await TopicsRepository.clearEventOverride(resolved.topicId);

      const embed = DiscordEmbedService.getSuccessEmbed("Event Override Removed")
        .addFields([
          { name: "Topic", value: resolved.topicTitle, inline: false },
        ]);

      await interaction.editReply({ embeds: [embed] });
      log.info(`[OWNER] Event override removed for topic "${resolved.topicTitle}" (ID: ${resolved.topicId})`);
    } catch (error: unknown) {
      const embed = DiscordEmbedService.getErrorEmbed("An error occurred while removing the event override.");
      await interaction.editReply({ embeds: [embed] });
      log.error(`Failed to remove event override: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  private formatEvalOutput(result: unknown, success: boolean): string {
    if (!success && result instanceof Error) {
      return result.stack ?? result.message;
    }

    if (typeof result === "string") {
      return result;
    }

    return inspect(result, { depth: 2, maxArrayLength: 50 });
  }

  private cleanSensitiveData(output: string): string {
    const token = Deno.env.get("DISCORD_TOKEN");
    const dbUrl = Deno.env.get("DATABASE_URL");
    const dbPass = Deno.env.get("DB_PASS");
    const dbRootPass = Deno.env.get("DB_ROOT_PASSWORD");

    let cleaned = output;

    if (token) {
      cleaned = cleaned.replaceAll(token, "[REDACTED]");
    }
    if (dbUrl) {
      cleaned = cleaned.replaceAll(dbUrl, "[REDACTED]");
    }
    if (dbPass) {
      cleaned = cleaned.replaceAll(dbPass, "[REDACTED]");
    }
    if (dbRootPass) {
      cleaned = cleaned.replaceAll(dbRootPass, "[REDACTED]");
    }

    cleaned = cleaned.replace(/[\w-]{24}\.[\w-]{6}\.[\w-]{27}/g, "[REDACTED]");

    return cleaned;
  }

  private truncateOutput(output: string, maxLength: number): string {
    if (output.length <= maxLength) {
      return output;
    }
    return output.slice(0, maxLength - 15) + "\n... truncated";
  }
}

export default new OwnerCommand();
