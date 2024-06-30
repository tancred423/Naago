const { SlashCommandBuilder } = require('@discordjs/builders')
const { ChannelType } = require('discord-api-types/v9')
const { Permissions, MessageActionRow, MessageButton } = require('discord.js')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const NaagoUtil = require('../naagoLib/NaagoUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription("Setup M'naago.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName('notifications')
        .setDescription('Set up automated lodestone notifications.')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Which category?')
            .setRequired(true)
            .addChoice('Topics (Latest news and patch notes)', 'topics')
            .addChoice(
              'Notices (Secondary news and letters from Naoki Yoshida)',
              'notices',
            )
            .addChoice(
              'Maintenances (All kind of maintenances and their durations)',
              'maintenances',
            )
            .addChoice('Updates (Outcome from maintenances)', 'updates')
            .addChoice(
              'Status (Technical difficulties and server statuses)',
              'status',
            )
            .addChoice(
              'Fashion Report (Solutions by Kaiyoko)',
              'fashion_report',
            ),
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription(
              'The channel to post the notifications in. Provide the current one to unset it.',
            )
            .setRequired(true)
            .addChannelType(ChannelType.GuildText),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('purge')
        .setDescription('Delete all saved data of this server.'),
    ),
  async execute(interaction) {
    if (
      !(await DiscordUtil.hasAllPermissions(
        interaction,
        interaction.member,
        Permissions.FLAGS.MANAGE_CHANNELS,
        Permissions.FLAGS.MANAGE_GUILD,
      ))
    )
      return

    if (interaction.options.getSubcommand() === 'notifications') {
      const guildId = interaction.guild.id
      const type = interaction.options.getString('type')
      const typeName = NaagoUtil.capitalizeFirstLetter(type)
      const channel = interaction.options.getChannel('channel')

      const currentChannelId = await DbUtil.getSetupChannelId(guildId, type)

      if (channel.id === currentChannelId) {
        // Unset
        const row = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId('setup.unset.cancel')
            .setLabel('No, cancel.')
            .setStyle('SECONDARY'),
          new MessageButton()
            .setCustomId(`setup.unset.${type}`)
            .setLabel('Yes, unset it.')
            .setStyle('DANGER'),
        )

        await interaction.reply({
          ephemeral: true,
          content: `${channel.toString()} is already set as ${typeName} notification channel. Do you want to unset it?`,
          components: [row],
        })

        return
      }

      // Set/Change
      const successful = await DbUtil.setSetupChannelId(
        guildId,
        type,
        channel.id,
      )

      if (!successful) {
        const embed = DiscordUtil.getErrorEmbed(
          `Could not set ${typeName} notification channel. Please contact Tancred#0001 for help.`,
        )

        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })

        return
      }

      const embed = DiscordUtil.getSuccessEmbed(
        `${typeName} notifications will now be posted in ${channel.toString()}.`,
      )

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      })
    } else if (interaction.options.getSubcommand() === 'purge') {
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId('setup.purge.cancel')
          .setLabel('No, cancel.')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId(`setup.purge.confirm`)
          .setLabel('Yes, delete it.')
          .setStyle('DANGER'),
      )

      await interaction.reply({
        ephemeral: true,
        content:
          'Are you sure you want to delete all stored data from this server?',
        components: [row],
      })
    }
  },

  async unset(interaction, buttonIdSplit) {
    if (buttonIdSplit.length !== 3)
      throw new Error('[setup: unset - button] button id length is !== 3')

    const type = buttonIdSplit[2]
    const typeName = NaagoUtil.capitalizeFirstLetter(type)

    if (type === 'cancel') {
      const embed = DiscordUtil.getSuccessEmbed('Cancelled.')

      await interaction.editReply({
        content: ' ',
        embeds: [embed],
        components: [],
      })

      return
    }

    const successful = DbUtil.unsetSetupChannelId(interaction.guild.id, type)

    if (!successful) {
      const embed = DiscordUtil.getErrorEmbed(
        `The channel for ${typeName} notifications could not be unset. Please contact Tancred#0001 for help.`,
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed],
        components: [],
      })
    }

    const embed = DiscordUtil.getSuccessEmbed(
      `${typeName} notifications will no longer be posted in that channel.`,
    )

    await interaction.editReply({
      content: ' ',
      embeds: [embed],
      components: [],
    })
  },

  async purge(interaction, buttonIdSplit) {
    if (buttonIdSplit.length !== 3)
      throw new Error('[setup: purge - button] button id length is !== 3')

    const action = buttonIdSplit[2]

    if (action === 'cancel') {
      const embed = DiscordUtil.getSuccessEmbed('Cancelled.')

      await interaction.editReply({
        content: ' ',
        embeds: [embed],
        components: [],
      })

      return
    }

    const successful = await DbUtil.purgeGuild(interaction.guild.id)

    if (!successful) {
      const embed = DiscordUtil.getErrorEmbed(
        "This guild's data could not be (fully) deleted. Please contact Tancred#0001 for help.",
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed],
        components: [],
      })

      return
    }

    const embed = DiscordUtil.getSuccessEmbed(
      'All data from this guild has been deleted.',
    )

    await interaction.editReply({
      content: ' ',
      embeds: [embed],
      components: [],
    })
  },
}
