const axios = require('axios')
const DbUtil = require('./DbUtil')
const moment = require('moment')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const GlobalUtil = require('./GlobalUtil')

module.exports = class MaintenancesUtil {
  static async getLast10() {
    try {
      const res = await axios.get('http://localhost:8081/lodestone/maintenance')
      return res?.data?.Maintenances ?? []
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async updateDb() {
    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] Checking for maintenances`
    )

    const latestMaintenances = await this.getLast10()
    const newMaintenances = []

    for (const maint of latestMaintenances) {
      if (await DbUtil.getMaintenanceByTitle(maint.title, maint.date * 1000))
        continue
      newMaintenances.push(maint)
    }

    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] New maintenances: ${
        newMaintenances.length
      }`
    )

    for (const newMaint of newMaintenances.reverse()) {
      if (newMaint.details) {
        let detailsFormatted = newMaint.details.text
          .replaceAll('<br>', '')
          .replaceAll('&amp;', '&')
          .replaceAll('\n', '<br/>')

        detailsFormatted = NaagoUtil.topicHtmlToMarkdown(detailsFormatted)
        detailsFormatted = NaagoUtil.cutString(detailsFormatted, 2500)
        const enrich = NaagoUtil.enrichDates(detailsFormatted)
        newMaint.details = enrich.text
        newMaint.mFrom = enrich.mFrom
        newMaint.mTo = enrich.mTo
        newMaint.date = newMaint.date * 1000
        newMaint.tag = newMaint.tag.replaceAll('[', '').replaceAll(']', '')
      }

      DbUtil.addMaintenance(newMaint)
      await MaintenancesUtil.sendMaint(newMaint)
    }
  }

  static async sendMaint(maint) {
    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const setups = await DbUtil.getSetups('maintenances')
    if (!setups || setups?.length < 1) return

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id)
        if (!guild) continue
        const channel = await guild.channels.fetch(setup.channel_id)
        if (!channel) continue

        const embed = DiscordUtil.getMaintenanceEmbed(maint)

        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.log(
          `[MAINTENANCES] Sending maintenance was NOT successful: ${err.message}`
        )
        continue
      }
    }
  }
}
