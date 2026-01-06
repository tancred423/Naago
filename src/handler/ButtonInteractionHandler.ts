import { ButtonInteraction, MessageFlags } from "discord.js";
import { ArrayManipulationService } from "../service/ArrayManipulationService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { HelpCommandHelper } from "../helper/HelpCommandHelper.ts";
import { StringManipulationService } from "../service/StringManipulationService.ts";
import { FavoriteCommandHelper } from "../helper/FavoriteCommandHelper.ts";
import { ProfileCommandHandler } from "../helper/ProfileCommandHelper.ts";
import { VerifyCommandHelper } from "../helper/VerifyCommandHelper.ts";
import { WhenIsResetCommandHelper } from "../helper/WhenIsResetCommandHelper.ts";
import { WorldStatusCommandHelper } from "../helper/WorldStatusCommandHelper.ts";
import { WorldStatusUnavailableError } from "../naagostone/error/WorldStatusUnavailableError.ts";
import { StatisticsService } from "../service/StatisticsService.ts";
import * as log from "@std/log";

export class ButtonInteractionHandler {
  private static cooldown: string[] = [];

  public static async execute(interaction: ButtonInteraction): Promise<void> {
    const userId = interaction.user.id;
    const messageAuthorId = interaction.message.interaction?.user.id;

    const isOnCooldown = this.cooldown.includes(userId);
    if (isOnCooldown) {
      await interaction.deferUpdate();
      return;
    }
    this.cooldown.push(userId);

    setTimeout(() => {
      ArrayManipulationService.removeItemFromArray(this.cooldown, userId);
    }, 1000);

    if (userId !== messageAuthorId) {
      await interaction.deferUpdate();
      const embed = DiscordEmbedService.getErrorEmbed(
        "You cannot interact with commands from someone else.",
      );
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const buttonId = interaction.customId;
    const buttonIdSplit = buttonId.split(".");
    const commandName = buttonIdSplit[0];

    switch (commandName) {
      case "profile": {
        if (buttonIdSplit.length >= 2) {
          const buttonName = buttonIdSplit[1];
          StatisticsService.trackProfileButton(buttonName).catch((err) => {
            log.error(`Failed to track profile button: ${err instanceof Error ? err.stack : String(err)}`);
          });
        }

        const content = StringManipulationService.buildLoadingText("Generating profile image...");
        await interaction.message.edit({ content });
        await interaction.deferUpdate();
        await ProfileCommandHandler.handlePageSwapButton(interaction, buttonIdSplit);
        break;
      }
      case "verify":
        await interaction.deferUpdate();
        await VerifyCommandHelper.update(interaction, buttonIdSplit);
        break;
      case "favorite":
        await interaction.deferUpdate();
        await FavoriteCommandHelper.handleRemoveFavoriteConfirmationButton(interaction, buttonIdSplit);
        break;
      case "help":
        await interaction.deferUpdate();
        await HelpCommandHelper.handlePageSwapButton(interaction, buttonIdSplit);
        break;
      case "worldstatus":
        await interaction.deferUpdate();
        try {
          await WorldStatusCommandHelper.handlePageSwapButton(interaction, buttonIdSplit);
        } catch (error: unknown) {
          const errorMessage = error instanceof WorldStatusUnavailableError
            ? error.message
            : "Failed to fetch world status. Please try again later.";
          const embed = DiscordEmbedService.getErrorEmbed(errorMessage);
          await interaction.editReply({ content: "", embeds: [embed], components: [] });
          log.error(`Failed to fetch world status: ${error instanceof Error ? error.stack : String(error)}`);
        }
        break;
      case "whenisreset":
        await interaction.deferUpdate();
        await WhenIsResetCommandHelper.handlePageSwapButton(interaction, buttonIdSplit);
        break;
      default:
        throw new Error(
          `ButtonUtil#execute: Command '${commandName}' not found.`,
        );
    }
  }
}
