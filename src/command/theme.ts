import { SlashCommandBuilder } from "@discordjs/builders";
import {
  ActionRow,
  ActionRowBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuComponent,
  StringSelectMenuInteraction,
} from "discord.js";
import { APISelectMenuOption } from "discord-api-types/v10";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { ThemeRepository } from "../database/repository/ThemeRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("theme")
    .setDescription("Set a theme for your verified character's profile."),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (!verification?.isVerified) {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Please verify your character first. See `/verify set`.",
      );
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed],
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const darkEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_DARK");
    const lightEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_LIGHT");
    const classicEmoji = DiscordEmojiService
      .getAsEmojiData("EMOJI_THEME_CLASSIC");
    const clearBlueEmoji = DiscordEmojiService
      .getAsEmojiData("EMOJI_THEME_CLEAR_BLUE");
    const characterSelectionEmoji = DiscordEmojiService
      .getAsEmojiData("EMOJI_THEME_CHARACTER_SELECTION");
    const amaurotEmoji = DiscordEmojiService
      .getAsEmojiData("EMOJI_THEME_AMAUROT");
    const moonEmoji = DiscordEmojiService
      .getAsEmojiData("EMOJI_THEME_MOON");
    const theFinalDaysEmoji = DiscordEmojiService
      .getAsEmojiData("EMOJI_THEME_THE_FINAL_DAYS");
    const ultimaThuleEmoji = DiscordEmojiService
      .getAsEmojiData("EMOJI_THEME_ULTIMA_THULE");

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("theme")
        .setPlaceholder("Select a theme...")
        .addOptions([
          {
            label: "Dark UI",
            description: "The dark UI like in-game",
            value: "dark",
            ...(darkEmoji && { emoji: darkEmoji }),
          },
          {
            label: "Light UI",
            description: "The light UI like in-game",
            value: "light",
            ...(lightEmoji && { emoji: lightEmoji }),
          },
          {
            label: "Classic UI",
            description: "The classic UI like in-game",
            value: "classic",
            ...(classicEmoji && { emoji: classicEmoji }),
          },
          {
            label: "Clear Blue UI",
            description: "The clear blue UI like in-game",
            value: "clear_blue",
            ...(clearBlueEmoji && { emoji: clearBlueEmoji }),
          },
          {
            label: "Character Selection",
            description: "Background from character selection",
            value: "character_selection",
            ...(characterSelectionEmoji && { emoji: characterSelectionEmoji }),
          },
          {
            label: "Amaurot",
            description: "Amaurot projection from the Tempest",
            value: "amaurot",
            ...(amaurotEmoji && { emoji: amaurotEmoji }),
          },
          {
            label: "The Moon",
            description: "Landscape on Mare Lamentorum",
            value: "moon",
            ...(moonEmoji && { emoji: moonEmoji }),
          },
          {
            label: "The Final Days",
            description: "Fiery star showers",
            value: "final_days",
            ...(theFinalDaysEmoji && { emoji: theFinalDaysEmoji }),
          },
          {
            label: "Ultima Thule",
            description: "At the edge of the universe",
            value: "ultima_thule",
            ...(ultimaThuleEmoji && { emoji: ultimaThuleEmoji }),
          },
        ]),
    );

    await interaction.editReply({
      content: "Which theme do you prefer?",
      components: [row],
    });
  },

  async update(interaction: StringSelectMenuInteraction) {
    const userId = interaction.user.id;
    const theme = interaction.values[0];
    const messageRow = interaction.message.components[0] as ActionRow<
      StringSelectMenuComponent
    >;
    const selectMenu = messageRow.components[0] as StringSelectMenuComponent;
    const themeName = selectMenu.options?.find(
      (option: APISelectMenuOption) => option.value === theme,
    )?.label ?? theme;

    try {
      await ThemeRepository.set(userId, theme);
    } catch (error: unknown) {
      console.error("Error setting theme:", error);
      const embed = DiscordEmbedService.getErrorEmbed(
        `Theme could not be set to \`${themeName}\`. Please contact Tancred#0001 for help.`,
      );

      await interaction.editReply({
        content: " ",
        components: [],
        embeds: [embed],
      });

      return;
    }

    const embed = DiscordEmbedService.getSuccessEmbed(
      `Your theme was set to \`${themeName}\`.`,
    );

    await interaction.editReply({
      content: " ",
      components: [],
      embeds: [embed],
    });
  },
};
