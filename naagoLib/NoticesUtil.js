const axios = require('axios')
const DbUtil = require('./DbUtil')
const moment = require('moment')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const GlobalUtil = require('./GlobalUtil')
const Parser = require('./LodestoneParser')
const {
  naagostonePort,
  saveLodestoneNews,
  sendLodestoneNews,
} = require('../config.json')

module.exports = class NoticesUtil {
  static async getLast10() {
    try {
      const res = await axios.get(
        `http://localhost:${naagostonePort}/lodestone/notices`
      )
      return res?.data?.Notices ?? []
    } catch (err) {
      console.log(`Getting notices failed: ${err.message}`)
      return []
    }
  }

  static async updateDb() {
    const latestNotices = await this.getLast10()
    const newNotices = []

    for (const notice of latestNotices) {
      if (!notice) continue

      notice.title = notice.title ? notice.title : notice.title_full
      notice.title = Parser.decodeHtmlChars(notice.title)
      notice.date = Parser.convertTimestampToMs(notice.date)

      // Only process new ones
      if (await DbUtil.getNoticeByTitle(notice.title, notice.date)) continue

      // Details
      notice.details = notice.details?.text
      notice.details = Parser.decodeHtmlChars(notice.details)
      notice.details = Parser.convertHtmlToMarkdown(notice.details)
      notice.details = Parser.convertTitles(notice.details)
      notice.details = Parser.convertDates('notices', notice.details)
      notice.details = NaagoUtil.cutString(notice.details, 2500)

      // Tag
      notice.tag = Parser.convertTag('notice', notice.tag)

      newNotices.push(notice)
    }

    for (const newNotice of newNotices.reverse()) {
      if (saveLodestoneNews) DbUtil.addNotices(newNotice)
      if (sendLodestoneNews) await NoticesUtil.sendNotice(newNotice)
    }

    return newNotices.length
  }

  static async sendNotice(notice) {
    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const setups = await DbUtil.getSetups('notices')
    if (!setups || setups?.length < 1) return

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id)
        if (!guild) continue
        const channel = await guild.channels.fetch(setup.channel_id)
        if (!channel) continue

        const embed = DiscordUtil.getNoticesEmbed(notice)

        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.log(
          `[${moment().format(
            'YYYY-MM-DD HH:mm'
          )}] [NOTICES] Sending notice to ${
            setup.guild_id
          } was NOT successful: ${err.message}`
        )
        continue
      }
    }
  }
}
