import {
  AttachmentBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { Buffer } from "node:buffer";
import { ProfileGeneratorService } from "../service/ProfileGeneratorService.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { ProfilePagesRepository } from "../database/repository/ProfilePagesRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { FfxivServerValidationService } from "../service/FfxivServerValidationService.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { StringManipulationService } from "../service/StringManipulationService.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View character profiles.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("me")
        .setDescription("Your verified character's profile.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("find")
        .setDescription("View anyone's character profile.")
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
        .setName("favorite")
        .setDescription("Get a favorite character's profile.")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "me") {
      const userId = interaction.user.id;
      const verification = await VerificationsRepository.find(userId);

      if (!verification?.isVerified) {
        const embed = DiscordEmbedService.getErrorEmbed(
          "Please verify your character first. See `/verify add`.",
        );
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          embeds: [embed],
        });
        return;
      }

      await interaction.deferReply();

      const characterId = verification.characterId;
      const characterDataDto = await FetchCharacterService.fetchCharacterCached(
        interaction,
        characterId,
      );

      if (!characterDataDto) {
        const embed = DiscordEmbedService.getErrorEmbed(
          `Could not fetch your character.\nPlease try again later.`,
        );
        await interaction.deleteReply();
        await interaction.followUp({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const character = characterDataDto.character;

      const profilePages = await ProfilePagesRepository.find(userId);
      const profilePage = (profilePages?.profilePage ?? "profile") as
        | "profile"
        | "classesjobs"
        | "equipment"
        | "attributes"
        | "portrait";
      const subProfilePage = profilePages?.subProfilePage as
        | "dowdom"
        | "dohdol"
        | null;

      if (!profilePage) {
        throw new Error("[/profile me] profilePage is undefined");
      }

      if (profilePage === "portrait") {
        const response = await fetch(character.portrait);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const file = new AttachmentBuilder(buffer);

        const components = ProfileGeneratorService.getComponents(
          profilePage,
          subProfilePage,
          "profile",
          characterId,
        );

        await interaction.editReply({
          content: `${character.name}🌸${character.server.world}`,
          files: [file],
          embeds: [],
          attachments: [],
          components: components,
        });
      } else {
        const profileImage = await ProfileGeneratorService.getImage(
          interaction,
          character,
          true,
          profilePage,
          subProfilePage,
        );
        if (!profileImage) {
          throw new Error("[/profile me] profileImage is undefined");
        }

        const file = new AttachmentBuilder(profileImage);

        const components = ProfileGeneratorService.getComponents(
          profilePage,
          subProfilePage,
          "profile",
          characterId,
        );

        await interaction.editReply({
          content:
            `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
          files: [file],
          embeds: [],
          attachments: [],
          components: components,
        });
      }
    } else if (subcommand === "find") {
      await interaction.deferReply();

      const name = StringManipulationService.formatName(
        interaction.options.getString("name")!,
      );
      const server = interaction.options.getString("server")!.toLowerCase();

      if (!FfxivServerValidationService.isValidServer(server)) {
        const embed = DiscordEmbedService.getErrorEmbed(
          `This server doesn't exist.`,
        );
        await interaction.deleteReply();
        await interaction.followUp({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const characterIds = await NaagostoneApiService.fetchCharacterIdsByName(
        name,
        server,
      );

      if (characterIds.length > 1) {
        const embed = DiscordEmbedService.getErrorEmbed(
          `Multiple characters were found for \`${name}\` on \`${server}\`.\nPlease provide the command with the full name of your character to get rid of duplicates.`,
        );
        await interaction.deleteReply();
        await interaction.followUp({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      } else if (characterIds.length < 1) {
        const embed = DiscordEmbedService.getErrorEmbed(
          `No characters were found for \`${name}\` on \`${server}\``,
        );
        await interaction.deleteReply();
        await interaction.followUp({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
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
            `Could not fetch your character.\nPlease try again later.`,
          );
          await interaction.deleteReply();
          await interaction.followUp({
            embeds: [embed],
            ephemeral: true,
          });
        } else {
          const character = characterDataDto.character;

          const profileImage = await ProfileGeneratorService.getImage(
            interaction,
            character,
            false,
            "profile",
          );
          if (!profileImage) {
            throw new Error("[/profile find] profileImage is undefined");
          }

          const file = new AttachmentBuilder(profileImage);

          const components = ProfileGeneratorService.getComponents(
            "profile",
            null,
            "profile",
            characterId,
          );

          await interaction.editReply({
            content:
              `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
            files: [file],
            embeds: [],
            attachments: [],
            components: components,
          });
        }
      }
    } else if (subcommand === "favorite") {
      const userId = interaction.user.id;
      const verification = await VerificationsRepository.find(userId);

      if (!verification?.isVerified) {
        const embed = DiscordEmbedService.getErrorEmbed(
          "Please verify your character first. See `/verify add`.",
        );
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          embeds: [embed],
        });
        return;
      }

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
        .setCustomId("favorite_character_select")
        .setPlaceholder("Select a character...")
        .addOptions(options);

      const row = new LabelBuilder()
        .setLabel("Whose profile do you want to see?")
        .setStringSelectMenuComponent(selectMenu);

      const modal = new ModalBuilder()
        .setCustomId("profile.favorite.modal")
        .setTitle("Favorite")
        .addLabelComponents(row);

      await interaction.showModal(modal);
    }
  },

  async update(interaction: ButtonInteraction, buttonIdSplit: string[]) {
    if (buttonIdSplit.length !== 3) {
      throw new Error("[/profile - button] button id length is !== 3");
    }

    const profilePage = buttonIdSplit[1] as
      | "profile"
      | "classesjobs"
      | "equipment"
      | "attributes"
      | "portrait"
      | "dowdom"
      | "dohdol";
    const characterId = parseInt(buttonIdSplit[2]);

    // Determine if this is "me" (user's own verified character) or "find/favorite"
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);
    const isMe = (verification?.isVerified ?? false) &&
      verification?.characterId === characterId;

    const characterDataDto = await FetchCharacterService.fetchCharacterCached(
      interaction,
      characterId,
    );

    if (!characterDataDto) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `Could not fetch this character.\nPlease try again later.`,
      );
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const character = characterDataDto.character;

    let subProfilePage: "dowdom" | "dohdol" | null = null;
    if (profilePage === "dowdom" || profilePage === "dohdol") {
      subProfilePage = profilePage;
    } else if (profilePage === "classesjobs" && !subProfilePage) {
      subProfilePage = "dowdom";
    }

    const actualProfilePage =
      profilePage === "dowdom" || profilePage === "dohdol"
        ? "classesjobs"
        : profilePage;

    // Save profile page preference for "me" subcommand
    if (isMe) {
      ProfilePagesRepository.set(userId, actualProfilePage, subProfilePage);
    }

    if (actualProfilePage === "portrait") {
      const response = await fetch(character.portrait);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const file = new AttachmentBuilder(buffer);

      const components = ProfileGeneratorService.getComponents(
        actualProfilePage,
        subProfilePage,
        "profile",
        characterId,
      );

      await interaction.editReply({
        content: `${character.name}🌸${character.server.world}`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      });
    } else {
      const profileImage = await ProfileGeneratorService.getImage(
        interaction,
        character,
        isMe,
        actualProfilePage,
        subProfilePage,
      );
      if (!profileImage) throw new Error("profileImage is undefined");

      const file = new AttachmentBuilder(profileImage);

      const components = ProfileGeneratorService.getComponents(
        actualProfilePage,
        subProfilePage,
        "profile",
        characterId,
      );

      await interaction.editReply({
        content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      });
    }
  },

  async handleFavoriteModal(interaction: ModalSubmitInteraction) {
    const fields = interaction.fields;
    const stringSelectValue = fields.getStringSelectValues(
      "favorite_character_select",
    );
    if (stringSelectValue.length !== 1) {
      throw new Error(
        `Found \`${stringSelectValue.length}\` select values. Expected 1.`,
      );
    }
    const characterId = parseInt(stringSelectValue[0]);

    await interaction.deferReply();

    const characterDataDto = await FetchCharacterService.fetchCharacterCached(
      interaction,
      characterId,
    );

    if (!characterDataDto) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `Could not fetch your character.\nPlease try again later.`,
      );
      await interaction.editReply({
        embeds: [embed],
      });
    } else {
      const character = characterDataDto.character;

      const profileImage = await ProfileGeneratorService.getImage(
        interaction,
        character,
        false,
        "profile",
      );
      if (!profileImage) {
        throw new Error("[/profile favorite] profileImage is undefined");
      }

      const file = new AttachmentBuilder(profileImage);

      const components = ProfileGeneratorService.getComponents(
        "profile",
        null,
        "profile",
        characterId,
      );

      await interaction.editReply({
        content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      });
    }
  },
};
