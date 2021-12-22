const axios = require('axios')
const DbUtil = require('./DbUtil')
const moment = require('moment')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const GlobalUtil = require('./GlobalUtil')

module.exports = class StatusUtil {
  static async getLast10() {
    try {
      const res = await axios.get('http://localhost:8081/lodestone/status')
      return res?.data?.Status ?? []
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async updateDb() {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm')}] Checking for status`)

    const latestStatuses = await this.getLast10()
    const newStatuses = []

    for (const status of latestStatuses) {
      if (
        await DbUtil.getStatusByTitle(
          status.title ? status.title : status.title_full,
          status.date * 1000
        )
      )
        continue
      newStatuses.push(status)
    }

    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] New statuses: ${
        newStatuses.length
      }`
    )

    for (const newStatus of newStatuses.reverse()) {
      if (newStatus.details) {
        let detailsFormatted = newStatus.details.text
          .replaceAll('<br>', '')
          .replaceAll('&amp;', '&')
          .replaceAll('\n', '<br/>')

        detailsFormatted = NaagoUtil.topicHtmlToMarkdown(detailsFormatted)
        detailsFormatted = NaagoUtil.cutString(detailsFormatted, 2500)
        const enrich = NaagoUtil.enrichDates(detailsFormatted)
        newStatus.details = enrich.text
        newStatus.date = newStatus.date * 1000
        newStatus.title = newStatus.tag ? newStatus.title : newStatus.title_full
        newStatus.tag = newStatus.tag
          ? `Status: ${newStatus.tag.replaceAll('[', '').replaceAll(']', '')}`
          : 'Status'
      }

      DbUtil.addStatus(newStatus)
      await StatusUtil.sendStatus(newStatus)
    }
  }

  static async sendStatus(status) {
    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const setups = await DbUtil.getSetups('status')
    if (!setups || setups?.length < 1) return

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id)
        if (!guild) continue
        const channel = await guild.channels.fetch(setup.channel_id)
        if (!channel) continue

        const embed = DiscordUtil.getStatusEmbed(status)

        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.log(
          `[STATUS] Sending status was NOT successful: ${err.message}`
        )
        continue
      }
    }
  }
}
