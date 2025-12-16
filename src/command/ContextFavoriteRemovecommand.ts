import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { NotInDatabaseError } from "../database/error/NotInDatabaseError.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { Command } from "./type/Command.ts";
import { DiscordMessageService } from "../service/DiscordMessageService.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";

class ContextFavoriteRemoveCommand extends Command {
  public readonly data = new ContextMenuCommandBuilder()
    .setName("Remove Favorite")
    .setType(ApplicationCommandType.User);

  public async execute(interaction: ContextMenuCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const user = interaction.user;
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

    try {
      await FavoritesRepository.delete(user.id, targetCharacter.id);
      await DiscordMessageService.editReplySuccess(
        interaction,
        `\`${targetCharacter.name}\` has been removed from your favorites.`,
      );
    } catch (error: unknown) {
      if (error instanceof NotInDatabaseError) {
        await DiscordMessageService.editReplySuccess(interaction, `\`${targetCharacter.name}\` is not a favorite.`);
        return;
      }

      await DiscordMessageService.editReplyError(
        interaction,
        `\`${targetCharacter.name}\` could not be removed from your favorites. Please try again later.`,
      );
    }
  }
}

export default new ContextFavoriteRemoveCommand();
