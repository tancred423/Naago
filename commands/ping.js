const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')
const { getBotColorByInteraction } = require('../naagoLib/DiscordUtil')
const NaagoUtil = require('../naagoLib/NaagoUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Bot's latency and uptime."),
  async execute(interaction) {
    const client = interaction.client
    const uptimeFormatted = NaagoUtil.convertMsToDigitalClock(client.uptime)

    const embed = new MessageEmbed()
      .setColor(await getBotColorByInteraction(interaction))
      .addField('Ping', `${client.ws.ping} ms`, true)
      .addField('Uptime', uptimeFormatted, true)
      .addField('Servers', (await client.guilds.fetch())?.size.toString(), true)

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    })
  }
}
