import {
  ChatInputCommandInteraction,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { ThemeRepository } from "../database/repository/ThemeRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";
import { Command } from "./type/Command.ts";
import { CommandMentionService } from "../service/CommandMentionService.ts";

class ThemeCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("theme")
    .setDescription("Set a theme for your verified character's profile.");

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (!verification?.isVerified) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `Please verify your character first. See ${CommandMentionService.mentionOrBacktick("verify", "add")}.`,
      );
      await interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [embed] });
      return;
    }

    const currentTheme = await ThemeRepository.get(verification.characterId);

    const darkEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_DARK");
    const lightEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_LIGHT");
    const classicEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_CLASSIC");
    const clearBlueEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_CLEAR_BLUE");
    const clearGreenEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_CLEAR_GREEN");
    const clearWhiteEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_CLEAR_WHITE");
    const characterSelectionEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_CHARACTER_SELECTION");
    const amaurotEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_AMAUROT");
    const moonEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_MOON");
    const theFinalDaysEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_THE_FINAL_DAYS");
    const ultimaThuleEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_ULTIMA_THULE");

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("theme_select")
      .setPlaceholder("Select a theme...")
      .addOptions([
        {
          label: "Dark UI",
          description: "The dark UI like in-game",
          value: "dark",
          default: currentTheme === "dark",
          ...(darkEmoji && { emoji: darkEmoji }),
        },
        {
          label: "Light UI",
          description: "The light UI like in-game",
          value: "light",
          default: currentTheme === "light",
          ...(lightEmoji && { emoji: lightEmoji }),
        },
        {
          label: "Classic UI",
          description: "The classic UI like in-game",
          value: "classic",
          default: currentTheme === "classic",
          ...(classicEmoji && { emoji: classicEmoji }),
        },
        {
          label: "Clear Blue UI",
          description: "The clear blue UI like in-game",
          value: "clear_blue",
          default: currentTheme === "clear_blue",
          ...(clearBlueEmoji && { emoji: clearBlueEmoji }),
        },
        {
          label: "Clear Green UI",
          description: "The clear green UI like in-game",
          value: "clear_green",
          default: currentTheme === "clear_green",
          ...(clearGreenEmoji && { emoji: clearGreenEmoji }),
        },
        {
          label: "Clear White UI",
          description: "The clear white UI like in-game",
          value: "clear_white",
          default: currentTheme === "clear_white",
          ...(clearWhiteEmoji && { emoji: clearWhiteEmoji }),
        },
        {
          label: "Character Selection",
          description: "Background from character selection",
          value: "character_selection",
          default: currentTheme === "character_selection",
          ...(characterSelectionEmoji && { emoji: characterSelectionEmoji }),
        },
        {
          label: "Amaurot",
          description: "Amaurot projection from the Tempest",
          value: "amaurot",
          default: currentTheme === "amaurot",
          ...(amaurotEmoji && { emoji: amaurotEmoji }),
        },
        {
          label: "The Moon",
          description: "Landscape on Mare Lamentorum",
          value: "moon",
          default: currentTheme === "moon",
          ...(moonEmoji && { emoji: moonEmoji }),
        },
        {
          label: "The Final Days",
          description: "Fiery star showers",
          value: "final_days",
          default: currentTheme === "final_days",
          ...(theFinalDaysEmoji && { emoji: theFinalDaysEmoji }),
        },
        {
          label: "Ultima Thule",
          description: "At the edge of the universe",
          value: "ultima_thule",
          default: currentTheme === "ultima_thule",
          ...(ultimaThuleEmoji && { emoji: ultimaThuleEmoji }),
        },
      ]);

    const row = new LabelBuilder()
      .setLabel("Which theme do you prefer?")
      .setStringSelectMenuComponent(selectMenu);

    const modal = new ModalBuilder()
      .setCustomId(`theme.modal.${verification.characterId}`)
      .setTitle("Select Theme")
      .addLabelComponents(row);

    await interaction.showModal(modal);
  }
}

export default new ThemeCommand();
