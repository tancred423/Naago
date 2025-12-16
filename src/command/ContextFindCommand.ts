import { ApplicationCommandType, AttachmentBuilder, ContextMenuCommandBuilder } from "discord.js";
import { ContextMenuCommandInteraction } from "discord.js";
import { ProfileGeneratorService } from "../service/ProfileGeneratorService.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { Command } from "./type/Command.ts";
import { DiscordMessageService } from "../service/DiscordMessageService.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";

class ContextFindCommand extends Command {
  public readonly data = new ContextMenuCommandBuilder()
    .setName("Find")
    .setType(ApplicationCommandType.User);

  public async execute(interaction: ContextMenuCommandInteraction): Promise<void> {
    const isVerified = interaction.targetId === interaction.user.id;

    await interaction.deferReply();

    let targetCharacterDataDto;
    try {
      targetCharacterDataDto = await FetchCharacterService.fetchVerifiedCharacterCachedByUserId(
        interaction,
        interaction.targetId,
      );
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        await DiscordMessageService.editReplyError(interaction, error.message);
        return;
      }
      throw error;
    }

    if (!targetCharacterDataDto) {
      await DiscordMessageService.editReplyError(interaction, "This user does not have a verified character.");
      return;
    }

    const targetCharacter = targetCharacterDataDto.character;
    const profileImage = await ProfileGeneratorService.getImage(targetCharacter, isVerified, "profile");

    if (!profileImage) {
      await DiscordMessageService.editReplyError(
        interaction,
        "Unable to generate profile image. Please try again later.",
      );
    }

    const file = new AttachmentBuilder(profileImage);
    const components = ProfileGeneratorService.getComponents("profile", null, "profile", targetCharacter?.id);
    const unix = targetCharacterDataDto.latestUpdate.unix();

    await interaction.editReply({
      content: `Latest Update: <t:${unix}:R>`,
      files: [file],
      embeds: [],
      attachments: [],
      components: components,
    });
  }
}

export default new ContextFindCommand();
