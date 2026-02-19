import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { EventReminderSetupsRepository } from "../database/repository/EventReminderSetupsRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { FilterExpressionService } from "../service/FilterExpressionService.ts";
import { InvalidSelectionError } from "./error/InvalidSelectionError.ts";
import * as log from "@std/log";
import { ThemeRepository } from "../database/repository/ThemeRepository.ts";

export class SetupCommandHelper {
  private static readonly typeNameMap: Record<string, string> = {
    "topics": "Topics",
    "notices": "Notices",
    "maintenances": "Maintenances",
    "updates": "Updates",
    "statuses": "Statuses",
  };

  public static async handleLodestoneModal(interaction: ModalSubmitInteraction): Promise<void> {
    const guildId = interaction.guild!.id;
    const fields = interaction.fields;

    const typeMap: Record<string, string> = {
      "setup_topics_channel_select": "topics",
      "setup_notice_channel_select": "notices",
      "setup_maintenance_channel_select": "maintenances",
      "setup_update_channel_select": "updates",
      "setup_status_channel_select": "statuses",
    };

    const results: string[] = [];

    for (const [customId, type] of Object.entries(typeMap)) {
      const channelValues = fields.getSelectedChannels(customId);
      const typeName = this.typeNameMap[type];

      if (channelValues && channelValues?.size > 1) {
        throw new InvalidSelectionError(
          `\`${typeName}\`: Invalid selection (expected 0 or 1 channel, got ${channelValues.size}).`,
        );
      }

      if (!channelValues || channelValues.size === 0) {
        try {
          await SetupsRepository.delete(guildId, type);
          results.push(`\`${typeName}\` notifications are disabled.`);
        } catch (error: unknown) {
          results.push(`\`${typeName}\` notifications could not be unset. Please try again later.`);
          log.error(
            `\`${typeName}\` notifications could not be unset: ${error instanceof Error ? error.stack : String(error)}`,
          );
        }
        continue;
      }

      const channelId = channelValues.first()!.id;
      try {
        await SetupsRepository.setChannelId(guildId, type, channelId);
        const channel = await interaction.guild!.channels.fetch(channelId);
        results.push(`\`${typeName}\` notifications are active in ${channel?.toString() ?? channelId}.`);
      } catch (error: unknown) {
        results.push(`\`${typeName}\` notification channel could not be set. Please try again later.`);
        log.error(
          `\`${typeName}\` notification channel could not be set: ${
            error instanceof Error ? error.stack : String(error)
          }`,
        );
      }
    }

    const activeChannels = results.filter((r) => r.includes("notifications are active"));
    const activeChannelCount = activeChannels.length;
    let message = results.join("\n") || "No changes were made.";
    if (activeChannelCount > 0) {
      const channelText = activeChannelCount === 1 ? "channel" : "channels";
      const supportServerUrl = Deno.env.get("SUPPORT_SERVER_URL")!;
      message +=
        `\n\n⚠️ **Important:** Make sure the bot has permission to view and send messages in the selected ${channelText}. Otherwise, news posts will fail silently. If you have any issues with news posts, feel free to join the [Support Server](${supportServerUrl}).`;
    }

    const embed = DiscordEmbedService.getSuccessEmbed(message);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  public static async handleFiltersModal(interaction: ModalSubmitInteraction): Promise<void> {
    const guildId = interaction.guild!.id;
    const fields = interaction.fields;

    const blacklistMap: Record<string, string> = {
      "setup_topics_blacklist": "topics",
      "setup_notices_blacklist": "notices",
      "setup_maintenances_blacklist": "maintenances",
      "setup_updates_blacklist": "updates",
      "setup_statuses_blacklist": "statuses",
    };

    const results: string[] = [];

    for (const [customId, type] of Object.entries(blacklistMap)) {
      const typeName = this.typeNameMap[type];
      let blacklistValue: string | null = null;

      try {
        blacklistValue = fields.getTextInputValue(customId);
      } catch {
        continue;
      }

      const hasChannel = await SetupsRepository.getChannelId(guildId, type);
      if (!hasChannel) {
        if (blacklistValue?.trim()) {
          results.push(`\`${typeName}\` filter ignored (no channel set up).`);
        }
        continue;
      }

      try {
        const normalizedValue = blacklistValue?.trim() || null;
        await SetupsRepository.setBlacklistKeywords(guildId, type, normalizedValue);

        if (normalizedValue) {
          const { patterns, warnings } = FilterExpressionService.parseFilterString(normalizedValue);
          const validCount = FilterExpressionService.getValidPatternCount(patterns);
          const displayText = FilterExpressionService.formatPatternsForDisplay(patterns);

          if (validCount > 0) {
            results.push(`\`${typeName}\` filter set (${displayText}).`);
          } else if (patterns.length > 0) {
            results.push(`\`${typeName}\` filter set but all patterns are invalid.`);
          }

          for (const warning of warnings) {
            results.push(`⚠️ \`${typeName}\`: ${warning}`);
          }
        } else {
          results.push(`\`${typeName}\` filter cleared.`);
        }
      } catch (error: unknown) {
        results.push(`\`${typeName}\` filter could not be set. Please try again later.`);
        log.error(
          `\`${typeName}\` filter could not be set: ${error instanceof Error ? error.stack : String(error)}`,
        );
      }
    }

    const embed = DiscordEmbedService.getSuccessEmbed(results.join("\n") || "No changes were made.");
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  public static async handleEventRemindersModal(interaction: ModalSubmitInteraction): Promise<void> {
    const guildId = interaction.guild!.id;
    const fields = interaction.fields;

    const enabledValues = fields.getStringSelectValues("setup_event_reminders_enabled");
    if (enabledValues.length !== 1) {
      throw new InvalidSelectionError(
        `\`Event Reminders\`: Invalid selection (expected exactly 1 value, got ${enabledValues.length}).`,
      );
    }

    const enabled = enabledValues[0] === "enabled";
    const channelValues = fields.getSelectedChannels("setup_event_reminders_channel");

    if (channelValues && channelValues.size > 1) {
      throw new InvalidSelectionError(
        `\`Event Reminders\`: Invalid selection (expected 0 or 1 channel, got ${channelValues.size}).`,
      );
    }

    const channelId = channelValues?.first()?.id ?? null;

    try {
      await EventReminderSetupsRepository.set(guildId, enabled, channelId);

      const results: string[] = [];
      results.push(enabled ? "Event reminders are **enabled**." : "Event reminders are **disabled**.");

      if (channelId) {
        const channel = await interaction.guild!.channels.fetch(channelId);
        results.push(`Reminders will be sent to ${channel?.toString() ?? channelId}.`);
      } else if (enabled) {
        results.push("Reminders will be sent to your topics news channel.");
      }

      const embed = DiscordEmbedService.getSuccessEmbed(results.join("\n"));
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (error: unknown) {
      log.error(
        `Event reminders setup could not be saved: ${error instanceof Error ? error.stack : String(error)}`,
      );
      const embed = DiscordEmbedService.getErrorEmbed("Event reminders could not be set up. Please try again later.");
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }

  public static async handleThemeModal(interaction: ModalSubmitInteraction): Promise<void> {
    const characterId = parseInt(interaction.customId.split(".").pop() ?? "0");

    if (characterId === 0) {
      throw new Error(`Couldnt get character ID from modal custom ID \`${interaction.customId}\`.`);
    }

    const userId = interaction.user.id;
    const fields = interaction.fields;
    const stringSelectValue = fields.getStringSelectValues("theme_select");

    if (stringSelectValue.length !== 1) {
      throw new Error(
        `Found \`${stringSelectValue.length}\` select values. Expected 1.`,
      );
    }

    const theme = stringSelectValue[0];
    const themeNames: Record<string, string> = {
      "dark": "Dark UI",
      "light": "Light UI",
      "classic": "Classic UI",
      "clear_blue": "Clear Blue UI",
      "character_selection": "Character Selection",
      "amaurot": "Amaurot",
      "moon": "The Moon",
      "final_days": "The Final Days",
      "ultima_thule": "Ultima Thule",
    };
    const themeName = themeNames[theme] ?? theme;

    try {
      await ThemeRepository.set(userId, characterId, theme);
      const embed = DiscordEmbedService.getSuccessEmbed(`Your theme was set to \`${themeName}\`.`);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (error: unknown) {
      console.error("Error setting theme", error);
      const embed = DiscordEmbedService.getErrorEmbed(
        `Theme could not be set to \`${themeName}\`. Please try again later.`,
      );
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
}
