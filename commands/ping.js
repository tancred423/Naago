const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')
const { getBotColorByInteraction } = require('../naagoLib/DiscordUtil')
const { time } = require('@discordjs/builders')
const moment = require('moment')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Bot's latency and uptime."),
  async execute(interaction) {
    const client = interaction.client
    const uptimeFormatted = time(
      moment().subtract(client.uptime, 'ms').toDate(),
      'R',
    )

    const embed = new MessageEmbed()
      .setColor(await getBotColorByInteraction(interaction))
      .addField('Ping', `${client.ws.ping} ms`, true)
      .addField('Latest restart', uptimeFormatted, true)
      .addField('Servers', (await client.guilds.fetch())?.size.toString(), true)

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    })
  },
}
