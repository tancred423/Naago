const { SlashCommandBuilder } = require('@discordjs/builders')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const DbUtil = require('../naagoLib/DbUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Current FFXIV maintenance if any.'),
  async execute(interaction) {
    const maints = await DbUtil.getCurrentMaintenances()

    if (maints) {
      const botColor = await DiscordUtil.getBotColorByInteraction(interaction)
      const embeds = []

      for (const maint of maints) {
        if (tmpEmbeds.length >= 10) break
        embeds.push(DiscordUtil.getMaintenanceEmbed(maint, botColor))
      }

      await interaction.reply({ embeds: embeds })
    } else
      await interaction.reply({
        ephemeral: true,
        content: 'There is no active maintenance.'
      })
  }
}
