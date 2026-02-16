import { AttachmentBuilder, ButtonInteraction, MessageFlags, ModalSubmitInteraction } from "discord.js";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { ProfilePagesRepository } from "../database/repository/ProfilePagesRepository.ts";
import { Buffer } from "node:buffer";
import { ProfileGeneratorService } from "../service/ProfileGeneratorService.ts";
import { ProfilePageType } from "../service/type/ProfilePageTypes.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";
import { DiscordMessageService } from "../service/DiscordMessageService.ts";

export class ProfileCommandHandler {
  public static async handlePageSwapButton(interaction: ButtonInteraction, buttonIdSplit: string[]): Promise<void> {
    if (buttonIdSplit.length !== 3) {
      throw new Error("[/profile - button] button id length is !== 3");
    }

    const profilePage = buttonIdSplit[1] as ProfilePageType;
    const characterId = parseInt(buttonIdSplit[2]);
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);
    const isMe = (verification?.isVerified ?? false) && verification?.characterId === characterId;

    let characterDataDto;
    try {
      characterDataDto = await FetchCharacterService.fetchCharacterCached(interaction, characterId);
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        const embed = DiscordEmbedService.getErrorEmbed(error.message);
        await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }
      throw error;
    }

    if (!characterDataDto) {
      const embed = DiscordEmbedService.getErrorEmbed(`Could not fetch this character.\nPlease try again later.`);
      await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const character = characterDataDto.character;

    if (isMe) {
      ProfilePagesRepository.set(userId, profilePage);
    }

    const cachedHint = characterDataDto.isCachedDueToUnavailability
      ? "\n⚠️ *Lodestone is currently unavailable. Showing cached data.*"
      : "";

    if (profilePage === "portrait") {
      const response = await fetch(character.portrait);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const file = new AttachmentBuilder(buffer);
      const components = ProfileGeneratorService.getComponents(
        profilePage,
        "profile",
        characterId,
      );

      await interaction.editReply({
        content: `${character.name}🌸${character.server.world}${cachedHint}`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      });

      return;
    }

    const profileImage = await ProfileGeneratorService.getImage(character, isMe, profilePage);

    if (!profileImage) throw new Error("profileImage is undefined");

    const file = new AttachmentBuilder(profileImage);
    const components = ProfileGeneratorService.getComponents(profilePage, "profile", characterId);

    await interaction.editReply({
      content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>${cachedHint}`,
      files: [file],
      embeds: [],
      attachments: [],
      components: components,
    });
  }

  public static async handleFavoriteModal(interaction: ModalSubmitInteraction): Promise<void> {
    const fields = interaction.fields;
    const stringSelectValue = fields.getStringSelectValues("favorite_character_select");

    if (stringSelectValue.length !== 1) {
      throw new Error(`Found \`${stringSelectValue.length}\` select values. Expected 1.`);
    }

    await interaction.deferReply();

    const characterId = parseInt(stringSelectValue[0]);
    let characterDataDto;
    try {
      characterDataDto = await FetchCharacterService.fetchCharacterCached(interaction, characterId);
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        const embed = DiscordEmbedService.getErrorEmbed(error.message);
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      throw error;
    }

    if (!characterDataDto) {
      const embed = DiscordEmbedService.getErrorEmbed(`Could not fetch your character.\nPlease try again later.`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const character = characterDataDto.character;

    if (character.active_classjob === null || character.portrait === null) {
      await DiscordMessageService.deleteAndFollowUpEphemeralError(
        interaction,
        `Cannot display character profile as profile page is private.`,
      );
      return;
    }

    const profileImage = await ProfileGeneratorService.getImage(character, false, "profile");

    if (!profileImage) {
      throw new Error("[/profile favorite] profileImage is undefined");
    }

    const file = new AttachmentBuilder(profileImage);
    const components = ProfileGeneratorService.getComponents("profile", "profile", characterId);

    const cachedHint = characterDataDto.isCachedDueToUnavailability
      ? "\n⚠️ *Lodestone is currently unavailable. Showing cached data.*"
      : "";

    await interaction.editReply({
      content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>${cachedHint}`,
      files: [file],
      embeds: [],
      attachments: [],
      components: components,
    });
  }
}
