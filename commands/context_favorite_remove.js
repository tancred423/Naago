const { ContextMenuCommandBuilder } = require('@discordjs/builders')
const { ApplicationCommandType } = require('discord-api-types/v9')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Remove Favorite')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true })

    const invoker = interaction.user
    const target = interaction.options.getMember('user')

    let character = await DbUtil.getCharacter(target.id)

    if (!character) {
      const embed = DiscordUtil.getErrorEmbed(
        'This user does not have a verified character.'
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed]
      })

      return
    }

    const successful = await DbUtil.removeFavorite(invoker.id, character.ID)

    if (successful === 'notfound') {
      const embed = DiscordUtil.getSuccessEmbed(
        `\`${character.name}\` is not a favorite already.`
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed]
      })

      return
    }

    if (!successful) {
      const embed = DiscordUtil.getErrorEmbed(
        `\`${character.name}\` could not be removed from your favorites. Please contact Tancred#0001 for help.`
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed]
      })

      return
    }

    const embed = DiscordUtil.getSuccessEmbed(
      `\`${character.name}\` has been removed from your favorites.`
    )

    await interaction.editReply({
      content: ' ',
      embeds: [embed]
    })
  }
}
