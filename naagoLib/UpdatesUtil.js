const axios = require('axios')
const DbUtil = require('./DbUtil')
const moment = require('moment')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const GlobalUtil = require('./GlobalUtil')

module.exports = class UpdatesUtil {
  static async getLast10() {
    try {
      const res = await axios.get('http://localhost:8081/lodestone/updates')
      return res?.data?.Updates ?? []
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async updateDb() {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm')}] Checking for updates`)

    const latestUpdates = await this.getLast10()
    const newUpdates = []

    for (const update of latestUpdates) {
      if (await DbUtil.getUpdateByTitle(update.title, update.date * 1000))
        continue
      newUpdates.push(update)
    }

    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] New updates: ${
        newUpdates.length
      }`
    )

    for (const newUpdate of newUpdates.reverse()) {
      if (newUpdate.details) {
        let detailsFormatted = newUpdate.details.text
          .replaceAll('<br>', '')
          .replaceAll('&amp;', '&')
          .replaceAll('\n', '<br/>')

        detailsFormatted = NaagoUtil.topicHtmlToMarkdown(detailsFormatted)
        detailsFormatted = NaagoUtil.cutString(detailsFormatted, 2500)
        const enrich = NaagoUtil.enrichDates(detailsFormatted)
        newUpdate.details = enrich.text
        newUpdate.date = newUpdate.date * 1000
      }

      DbUtil.addUpdate(newUpdate)
      await UpdatesUtil.sendUpdate(newUpdate)
    }
  }

  static async sendUpdate(update) {
    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const setups = await DbUtil.getSetups('updates')
    if (!setups || setups?.length < 1) return

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id)
        if (!guild) continue
        const channel = await guild.channels.fetch(setup.channel_id)
        if (!channel) continue

        const embed = DiscordUtil.getUpdatesEmbed(update)

        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.log(
          `[UPDATES] Sending update was NOT successful: ${err.message}`
        )
        continue
      }
    }
  }
}
