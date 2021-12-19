const { SlashCommandBuilder } = require('@discordjs/builders')
const TopicsUtil = require('../naagoLib/TopicsUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('news')
    .setDescription('Current FFXIV news.'),
  async execute(interaction) {
    await interaction.deferReply()
    await TopicsUtil.updateDb(interaction)
  }
}
