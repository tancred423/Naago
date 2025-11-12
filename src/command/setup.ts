import {
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionsBitField,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { ThemeRepository } from "../database/repository/ThemeRepository.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup M'naago.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lodestone")
        .setDescription(
          "Set up which channels receive automated Lodestone news updates.",
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("theme")
        .setDescription("Set a theme for your verified character's profile.")
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === "lodestone") {
      const guildId = interaction.guild!.id;
      const setups = await SetupsRepository.getAllByGuildId(guildId);
      const setupMap = Object.fromEntries(
        setups.map((setup) => [setup.type, setup]),
      );
      const {
        topic: currentTopicChannel,
        notice: currentNoticeChannel,
        maintenance: currentMaintenanceChannel,
        update: currentUpdateChannel,
        status: currentStatusChannel,
      } = setupMap;

      const topicChannelMenu = new ChannelSelectMenuBuilder()
        .setCustomId("setup_topics_channel_select")
        .setPlaceholder("Channel to post topics in...")
        .setChannelTypes(ChannelType.GuildText)
        .setRequired(false);
      if (currentTopicChannel) {
        topicChannelMenu.setDefaultChannels(currentTopicChannel.channelId);
      }
      const topicRow = new LabelBuilder()
        .setLabel("Topics (Latest news, PLL's and patch notes)")
        .setChannelSelectMenuComponent(topicChannelMenu);

      const noticeChannelMenu = new ChannelSelectMenuBuilder()
        .setCustomId("setup_notice_channel_select")
        .setPlaceholder("Channel to post notices in...")
        .setChannelTypes(ChannelType.GuildText)
        .setRequired(false);
      if (currentNoticeChannel) {
        noticeChannelMenu.setDefaultChannels(currentNoticeChannel.channelId);
      }
      const noticeRow = new LabelBuilder()
        .setLabel("Notices (Secondary news)")
        .setChannelSelectMenuComponent(noticeChannelMenu);

      const maintenanceChannelMenu = new ChannelSelectMenuBuilder()
        .setCustomId("setup_maintenance_channel_select")
        .setPlaceholder("Channel to post maintenances in...")
        .setChannelTypes(ChannelType.GuildText)
        .setRequired(false);
      if (currentMaintenanceChannel) {
        maintenanceChannelMenu.setDefaultChannels(
          currentMaintenanceChannel.channelId,
        );
      }
      const maintenanceRow = new LabelBuilder()
        .setLabel("Maintenances (And their durations)")
        .setChannelSelectMenuComponent(maintenanceChannelMenu);

      const updateChannelMenu = new ChannelSelectMenuBuilder()
        .setCustomId("setup_update_channel_select")
        .setPlaceholder("Channel to post updates in...")
        .setChannelTypes(ChannelType.GuildText)
        .setRequired(false);
      if (currentUpdateChannel) {
        updateChannelMenu.setDefaultChannels(currentUpdateChannel.channelId);
      }
      const updateRow = new LabelBuilder()
        .setLabel("Updates (Outcome from maintenances)")
        .setChannelSelectMenuComponent(updateChannelMenu);

      const statusChannelMenu = new ChannelSelectMenuBuilder()
        .setCustomId("setup_status_channel_select")
        .setPlaceholder("Channel to post statuses in...")
        .setChannelTypes(ChannelType.GuildText)
        .setRequired(false);
      if (currentStatusChannel) {
        statusChannelMenu.setDefaultChannels(currentStatusChannel.channelId);
      }
      const statusRow = new LabelBuilder()
        .setLabel("Statuses (Tech. difficulties & server status)")
        .setChannelSelectMenuComponent(statusChannelMenu);

      const modal = new ModalBuilder()
        .setCustomId("setup.lodestone")
        .setTitle("Lodestone News Channels")
        .addLabelComponents(
          topicRow,
          noticeRow,
          maintenanceRow,
          updateRow,
          statusRow,
        );

      await interaction.showModal(modal);
    } else if (interaction.options.getSubcommand() === "theme") {
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

      const darkEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_DARK");
      const lightEmoji = DiscordEmojiService.getAsEmojiData(
        "EMOJI_THEME_LIGHT",
      );
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

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("theme_select")
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
        ]);

      const row = new LabelBuilder()
        .setLabel("Which theme do you prefer?")
        .setStringSelectMenuComponent(selectMenu);

      const modal = new ModalBuilder()
        .setCustomId(`setup.theme.modal.${verification.characterId}`)
        .setTitle("Select Theme")
        .addLabelComponents(row);

      await interaction.showModal(modal);
    }
  },

  async handleModal(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guild!.id;
    const fields = interaction.fields;

    const typeMap: Record<string, string> = {
      "setup_topics_channel_select": "topic",
      "setup_notice_channel_select": "notice",
      "setup_maintenance_channel_select": "maintenance",
      "setup_update_channel_select": "update",
      "setup_status_channel_select": "status",
    };

    const typeNameMap: Record<string, string> = {
      "topic": "Topics",
      "notice": "Notices",
      "maintenance": "Maintenances",
      "update": "Updates",
      "status": "Statuses",
    };

    const results: string[] = [];

    for (const [customId, type] of Object.entries(typeMap)) {
      const channelValues = fields.getSelectedChannels(customId);
      const typeName = typeNameMap[type];

      if (!channelValues || channelValues.size === 0) {
        try {
          await SetupsRepository.delete(guildId, type);
          results.push(`\`${typeName}\` notifications are disabled.`);
        } catch (_error: unknown) {
          results.push(
            `\`${typeName}\` notifications could not be unset. Please try again later.`,
          );
        }
      } else if (channelValues.size === 1) {
        const channelId = channelValues.first()!.id;
        try {
          await SetupsRepository.setChannelId(guildId, type, channelId);
          const channel = await interaction.guild!.channels.fetch(channelId);
          results.push(
            `\`${typeName}\` notifications are active in ${
              channel?.toString() ?? channelId
            }.`,
          );
        } catch (_error: unknown) {
          results.push(
            `\`${typeName}\` notification channel could not be set. Please try again later.`,
          );
        }
      } else {
        results.push(
          `\`${typeName}\`: Invalid selection (expected 0 or 1 channel, got ${channelValues.size}).`,
        );
      }
    }

    const embed = DiscordEmbedService.getSuccessEmbed(
      results.join("\n") || "No changes were made.",
    );

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },

  async handleThemeModal(interaction: ModalSubmitInteraction) {
    const characterId = parseInt(interaction.customId.split(".").pop() ?? "0");
    if (characterId === 0) {
      throw new Error(
        `Couldnt get character ID from modal custom ID \`${interaction.customId}\`.`,
      );
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
    } catch (error: unknown) {
      console.error("Error setting theme:", error);
      const embed = DiscordEmbedService.getErrorEmbed(
        `Theme could not be set to \`${themeName}\`. Please contact Tancred#0001 for help.`,
      );

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const embed = DiscordEmbedService.getSuccessEmbed(
      `Your theme was set to \`${themeName}\`.`,
    );

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
