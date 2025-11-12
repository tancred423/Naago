import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import * as log from "@std/log";
import { FfxivServerValidationService } from "../service/FfxivServerValidationService.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { MaximumAmountReachedError } from "../database/error/MaximumAmountReachedError.ts";
import { NotInDatabaseError } from "../database/error/NotInDatabaseError.ts";
import { StringManipulationService } from "../service/StringManipulationService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("favorite")
    .setDescription("Save up to 25 characters as favorites.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a character to your favorites.")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("A full character name.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("server")
            .setDescription("The server the character is on.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a character from your favorites.")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (verification?.isVerified) {
      if (interaction.options.getSubcommand() === "add") {
        const name = StringManipulationService.formatName(
          interaction.options.getString("name")!,
        );
        const server = interaction.options.getString("server")!.toLowerCase();

        if (!FfxivServerValidationService.isValidServer(server)) {
          const embed = DiscordEmbedService.getErrorEmbed(
            `The given server \`${server}\` doesn't exist.`,
          );
          await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const characterIds = await NaagostoneApiService.fetchCharacterIdsByName(
          name,
          server,
        );

        if (characterIds.length > 1) {
          const embed = DiscordEmbedService.getErrorEmbed(
            `Multiple characters were found for \`${name}\` on \`${server}\`.\nPlease provide the command with the full name of your character to get rid of duplicates.`,
          );
          await interaction.editReply({
            embeds: [embed],
          });
        } else if (characterIds.length < 1) {
          const embed = DiscordEmbedService.getErrorEmbed(
            `No characters were found for \`${name}\` on \`${server}\``,
          );
          await interaction.editReply({
            embeds: [embed],
          });
        } else {
          const characterId = characterIds[0];
          const characterDataDto = await FetchCharacterService
            .fetchCharacterCached(
              interaction,
              characterId,
            );

          if (!characterDataDto) {
            const embed = DiscordEmbedService.getErrorEmbed(
              `Could not fetch the character.\nPlease try again later.`,
            );
            await interaction.editReply({
              embeds: [embed],
            });
          } else {
            const character = characterDataDto.character;

            try {
              await FavoritesRepository.add(
                userId,
                characterId,
                character.name,
                `${character.server.world} (${character.server.dc})`,
              );
              await sendSuccess(
                interaction,
                `\`${name}\` has been added to your favorites.`,
              );
            } catch (error: unknown) {
              if (error instanceof MaximumAmountReachedError) {
                await sendError(
                  interaction,
                  `\`${name}\` was NOT added as favorite as you already reached the maximum of 25.\nPlease remove a favorite before adding a new one. See \`/favorite remove\`.`,
                );
                return;
              }

              await sendError(
                interaction,
                `An unknown error prevented \`${name}\` to be added as favorite. Please try again later.`,
              );

              log.error("Error while adding favorite.", error);
            }
          }
        }
      } else if (interaction.options.getSubcommand() === "remove") {
        const favorites = await FavoritesRepository.get(userId);

        if (favorites?.length === 0) {
          const embed = DiscordEmbedService.getErrorEmbed(
            `Please add favorites first. See \`/favorite add\``,
          );
          await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const options = [];
        for (const favorite of favorites) {
          options.push({
            label: favorite.characterName,
            description: favorite.server,
            value: favorite.characterId.toString(),
          });
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("favorite_character_remove")
          .setPlaceholder("Select a character...")
          .addOptions(options);

        const row = new LabelBuilder()
          .setLabel("Which character do you want to remove?")
          .setStringSelectMenuComponent(selectMenu);

        const modal = new ModalBuilder()
          .setCustomId("favorite.remove.modal")
          .setTitle("Remove Favorite")
          .addLabelComponents(row);

        await interaction.showModal(modal);
      }
    } else {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Please verify your character first. See `/verify add`.",
      );
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed],
      });
    }
  },

  async remove(interaction: ModalSubmitInteraction) {
    const fields = interaction.fields;
    const stringSelectValue = fields.getStringSelectValues(
      "favorite_character_remove",
    );
    if (stringSelectValue.length !== 1) {
      throw new Error(
        `Found \`${stringSelectValue.length}\` select values. Expected 1.`,
      );
    }
    const characterId = parseInt(stringSelectValue[0]);

    const userId = interaction.user.id;
    const favorites = await FavoritesRepository.get(userId);
    const favorite = favorites.find((f) => f.characterId === characterId);
    const characterName = favorite?.characterName ?? characterId.toString();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("favorite.unset.cancel")
        .setLabel("No, cancel.")
        .setStyle(2),
      new ButtonBuilder()
        .setCustomId(`favorite.unset.${characterId}.${characterName}`)
        .setLabel("Yes, remove them.")
        .setStyle(4),
    );

    await interaction.reply({
      content:
        `Are you sure you want to remove \`${characterName}\` from your favorites?`,
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },

  async update(interaction: ButtonInteraction, buttonIdSplit: string[]) {
    if (buttonIdSplit.length === 3 && buttonIdSplit[2] === "cancel") {
      const embed = DiscordEmbedService.getSuccessEmbed("Cancelled.");

      await interaction.editReply({
        content: " ",
        components: [],
        embeds: [embed],
      });

      return;
    }

    if (buttonIdSplit.length !== 4) {
      throw new Error("[favorite.js#remove] button id length is !== 4");
    }

    const userId = interaction.user.id;
    const characterId = parseInt(buttonIdSplit[2]);
    const characterName = buttonIdSplit[3];

    try {
      await FavoritesRepository.delete(userId, characterId);
      await sendSuccess(
        interaction,
        `\`${characterName}\` has been removed from your favorites.`,
      );
    } catch (error: unknown) {
      if (error instanceof NotInDatabaseError) {
        await sendError(
          interaction,
          `${characterName} is not in your favorites.`,
        );
        return;
      }

      await sendError(
        interaction,
        `An unknown error prevented \`${characterName}\` from being removed from your favorites. Please try again later.`,
      );
    }
  },
};

async function sendSuccess(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  message: string,
): Promise<void> {
  const embed = DiscordEmbedService.getSuccessEmbed(message);

  await interaction.editReply({
    content: " ",
    components: [],
    embeds: [embed],
  });
}

async function sendError(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  message: string,
): Promise<void> {
  const embed = DiscordEmbedService.getErrorEmbed(message);

  await interaction.editReply({
    content: " ",
    components: [],
    embeds: [embed],
  });
}
