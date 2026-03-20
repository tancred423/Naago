import { ButtonInteraction, DiscordAPIError, MessageFlags, PermissionsBitField } from "discord.js";
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
        await interaction.deferUpdate();

        if (buttonIdSplit.length >= 2) {
          const buttonName = buttonIdSplit[1];
          StatisticsService.trackProfileButton(buttonName).catch((err) => {
            log.error(`Failed to track profile button: ${err instanceof Error ? err.stack : String(err)}`);
          });
        }

        const content = StringManipulationService.buildLoadingText("Generating profile image...");
        await this.updateInteractionMessage(interaction, content);
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

  private static async updateInteractionMessage(interaction: ButtonInteraction, content: string): Promise<void> {
    try {
      await interaction.message.edit({ content });
    } catch (error: unknown) {
      this.logMessageEditFailure(interaction, error);
    }
  }

  private static logMessageEditFailure(interaction: ButtonInteraction, error: unknown): void {
    if (error instanceof DiscordAPIError && error.code === 50001) {
      const diagnosis = this.buildMissingAccessDiagnosis(interaction);
      log.error(
        `DiscordAPIError(50001) Missing Access editing interaction message. ${diagnosis} error=${
          this.formatError(error)
        }`,
      );
      return;
    }

    log.error(`Failed to edit interaction message: ${this.formatError(error)}`);
  }

  private static buildMissingAccessDiagnosis(interaction: ButtonInteraction): string {
    const clientUser = interaction.client.user;
    const guildChannel = interaction.inGuild() ? interaction.channel : null;
    const permissions = clientUser && guildChannel ? guildChannel.permissionsFor(clientUser) : null;
    const permissionSnapshot = this.getRelevantPermissionSnapshot(guildChannel, permissions);
    const missingPermissions = permissionSnapshot
      .filter((entry) => entry.allowed === false)
      .map((entry) => entry.name);
    const botIsMessageAuthor = interaction.message.author?.id === clientUser?.id;
    const likelyCauses: string[] = [];

    if (!clientUser) {
      likelyCauses.push("client user unavailable");
    }

    if (!interaction.inGuild()) {
      likelyCauses.push("interaction is outside a guild");
    }

    if (!interaction.channel) {
      likelyCauses.push("interaction channel unavailable");
    }

    if (!botIsMessageAuthor) {
      likelyCauses.push("message author is not the bot");
    }

    if (guildChannel && !guildChannel.viewable) {
      likelyCauses.push("bot cannot view the channel");
    }

    if (guildChannel && !permissions) {
      likelyCauses.push("bot permissions could not be resolved for the channel");
    }

    if (missingPermissions.length > 0) {
      likelyCauses.push(`missing relevant permissions: ${missingPermissions.join(",")}`);
    }

    if (!interaction.message.editable) {
      likelyCauses.push("Discord.js reports message.editable=false");
    }

    if (guildChannel?.isThread()) {
      if (!guildChannel.joined) {
        likelyCauses.push("bot is not a member of the thread");
      }

      if (guildChannel.archived) {
        likelyCauses.push("thread is archived");
      }

      if (guildChannel.locked) {
        likelyCauses.push("thread is locked");
      }
    }

    return this.formatDiagnosticFields({
      guildId: interaction.guild?.id ?? null,
      guildName: interaction.guild?.name ?? null,
      channelId: interaction.channelId ?? null,
      channelName: interaction.inGuild() ? guildChannel?.name ?? null : null,
      channelType: interaction.channel?.type ?? null,
      channelViewable: guildChannel?.viewable ?? null,
      messageId: interaction.message.id,
      messageAuthorId: interaction.message.author?.id ?? null,
      messageEditable: interaction.message.editable,
      botUserId: clientUser?.id ?? null,
      botIsMessageAuthor,
      relevantPermissions: permissionSnapshot.length > 0
        ? permissionSnapshot.map((entry) => `${entry.name}:${entry.allowed === null ? "unknown" : entry.allowed}`).join(
          ",",
        )
        : null,
      threadJoined: guildChannel?.isThread() ? guildChannel.joined : null,
      threadArchived: guildChannel?.isThread() ? guildChannel.archived : null,
      threadLocked: guildChannel?.isThread() ? guildChannel.locked : null,
      likelyCauses: likelyCauses.length > 0 ? likelyCauses.join(" | ") : "unknown",
    });
  }

  private static getRelevantPermissionSnapshot(
    channel: ButtonInteraction["channel"],
    permissions: Readonly<PermissionsBitField> | null,
  ): Array<{ name: string; allowed: boolean | null }> {
    const entries = [
      { name: "ViewChannel", flag: PermissionsBitField.Flags.ViewChannel },
      { name: "ReadMessageHistory", flag: PermissionsBitField.Flags.ReadMessageHistory },
      {
        name: channel?.isThread() ? "SendMessagesInThreads" : "SendMessages",
        flag: channel?.isThread()
          ? PermissionsBitField.Flags.SendMessagesInThreads
          : PermissionsBitField.Flags.SendMessages,
      },
    ];

    return entries.map(({ name, flag }) => ({
      name,
      allowed: permissions ? permissions.has(flag) : null,
    }));
  }

  private static formatDiagnosticFields(fields: Record<string, boolean | number | string | null>): string {
    return Object.entries(fields)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(" ");
  }

  private static formatError(error: unknown): string {
    return error instanceof Error ? error.stack ?? error.message : String(error);
  }
}
