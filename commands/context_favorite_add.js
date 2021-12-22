const { ContextMenuCommandBuilder } = require('@discordjs/builders')
const { ApplicationCommandType } = require('discord-api-types/v9')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Add Favorite')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true })

    const invoker = interaction.user
    const target = interaction.options.getMember('user')

    let character = await DbUtil.getCharacter(target.id)

    if (!character?.name)
      character = await DbUtil.fetchCharacter(interaction, character.ID)

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

    let successful = await DbUtil.addFavorite(
      invoker.id,
      character.ID,
      character.name,
      `${character.server.world} (${character.server.dc})`
    )

    if (successful === 'capped') {
      const embed = DiscordUtil.getErrorEmbed(
        `\`${character.name}\` was NOT added as favorite as you already reached the maximum of 25.\nPlease remove a favorite before adding a new one. See \`/favorite remove\`.`
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed]
      })

      return
    }

    if (successful === 'existant') {
      const embed = DiscordUtil.getSuccessEmbed(
        `\`${character.name}\` is already a favorite.`
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed]
      })

      return
    }

    if (successful) {
      const embed = DiscordUtil.getSuccessEmbed(
        `\`${character.name}\` was added as favorite.`
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed]
      })
    } else {
      const embed = DiscordUtil.getErrorEmbed(
        `\`${character.name}\` could not be added to your favorites. Please contact Tancred#0001 for help.`
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed]
      })
    }
  }
}
