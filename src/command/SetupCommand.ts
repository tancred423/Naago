import {
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  LabelBuilder,
  ModalBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { Command } from "./type/Command.ts";
import { InvalidSubCommandError } from "./error/InvalidSubCommandError.ts";

class SetupCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup M'naago.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lodestone")
        .setDescription("Set up which channels receive automated Lodestone news updates.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("filters")
        .setDescription("Set up keyword filter blacklist to exclude certain Lodestone news.")
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels);

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "lodestone":
        await this.handleLodestone(interaction);
        break;
      case "filters":
        await this.handleFilters(interaction);
        break;
      default:
        throw new InvalidSubCommandError(`/setup ${subCommand}`);
    }
  }

  private async handleLodestone(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guild!.id;
    const setups = await SetupsRepository.getAllByGuildId(guildId);
    const setupMap = Object.fromEntries(setups.map((setup) => [setup.type, setup]));
    const {
      topics: currentTopicChannel,
      notices: currentNoticeChannel,
      maintenances: currentMaintenanceChannel,
      updates: currentUpdateChannel,
      statuses: currentStatusChannel,
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
      maintenanceChannelMenu.setDefaultChannels(currentMaintenanceChannel.channelId);
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
      .addLabelComponents(topicRow, noticeRow, maintenanceRow, updateRow, statusRow);

    await interaction.showModal(modal);
  }

  private async handleFilters(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guild!.id;
    const setups = await SetupsRepository.getAllByGuildId(guildId);
    const setupMap = Object.fromEntries(setups.map((setup) => [setup.type, setup]));

    const topicBlacklistInput = new TextInputBuilder()
      .setCustomId("setup_topics_blacklist")
      .setPlaceholder("e.g. new optional items, crystalline conflict")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(4000);
    if (setupMap.topics?.blacklistKeywords) {
      topicBlacklistInput.setValue(setupMap.topics.blacklistKeywords);
    }
    const topicRow = new LabelBuilder()
      .setLabel("Topics Filter")
      .setTextInputComponent(topicBlacklistInput);

    const noticeBlacklistInput = new TextInputBuilder()
      .setCustomId("setup_notices_blacklist")
      .setPlaceholder("e.g. eternal bonding reservation, against in-game rmt")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(4000);
    if (setupMap.notices?.blacklistKeywords) {
      noticeBlacklistInput.setValue(setupMap.notices.blacklistKeywords);
    }
    const noticeRow = new LabelBuilder()
      .setLabel("Notices Filter")
      .setTextInputComponent(noticeBlacklistInput);

    const maintenanceBlacklistInput = new TextInputBuilder()
      .setCustomId("setup_maintenances_blacklist")
      .setPlaceholder("e.g. companion app, online store")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(4000);
    if (setupMap.maintenances?.blacklistKeywords) {
      maintenanceBlacklistInput.setValue(setupMap.maintenances.blacklistKeywords);
    }
    const maintenanceRow = new LabelBuilder()
      .setLabel("Maintenances Filter")
      .setTextInputComponent(maintenanceBlacklistInput);

    const updateBlacklistInput = new TextInputBuilder()
      .setCustomId("setup_updates_blacklist")
      .setPlaceholder("e.g. companion app, the lodestone updated")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(4000);
    if (setupMap.updates?.blacklistKeywords) {
      updateBlacklistInput.setValue(setupMap.updates.blacklistKeywords);
    }
    const updateRow = new LabelBuilder()
      .setLabel("Updates Filter")
      .setTextInputComponent(updateBlacklistInput);

    const statusBlacklistInput = new TextInputBuilder()
      .setCustomId("setup_statuses_blacklist")
      .setPlaceholder("e.g. ddos attack, crystal, chaos")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(4000);
    if (setupMap.statuses?.blacklistKeywords) {
      statusBlacklistInput.setValue(setupMap.statuses.blacklistKeywords);
    }
    const statusRow = new LabelBuilder()
      .setLabel("Statuses Filter")
      .setTextInputComponent(statusBlacklistInput);

    const modal = new ModalBuilder()
      .setCustomId("setup.filters")
      .setTitle("Lodestone News Filter Blacklist")
      .addLabelComponents(topicRow, noticeRow, maintenanceRow, updateRow, statusRow);

    await interaction.showModal(modal);
  }
}

export default new SetupCommand();
