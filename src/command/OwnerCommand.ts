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
import { inspect } from "node:util";
import * as log from "@std/log";

const OWNER_COMMANDS_USER_ID = Deno.env.get("OWNER_COMMANDS_USER_ID");

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
