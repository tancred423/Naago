import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionsBitField,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { Command } from "./type/Command.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { NewsQueueProcessor } from "../service/NewsQueueProcessor.ts";
import { InvalidSubCommandError } from "./error/InvalidSubCommandError.ts";
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
}

export default new OwnerCommand();
