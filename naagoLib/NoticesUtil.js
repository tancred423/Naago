const axios = require('axios')
const DbUtil = require('./DbUtil')
const moment = require('moment')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const GlobalUtil = require('./GlobalUtil')

module.exports = class NoticesUtil {
  static async getLast10() {
    try {
      const res = await axios.get('http://localhost:8081/lodestone/notices')
      return res?.data?.Notices ?? []
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async updateDb() {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm')}] Checking for notices`)

    const latestNotices = await this.getLast10()
    const newNotices = []

    for (const notice of latestNotices) {
      if (
        await DbUtil.getNoticeByTitle(
          notice.title ? notice.title : notice.title_full,
          notice.date * 1000
        )
      )
        continue
      newNotices.push(notice)
    }

    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] New notices: ${
        newNotices.length
      }`
    )

    for (const newNotice of newNotices.reverse()) {
      if (newNotice.details) {
        let detailsFormatted = newNotice.details.text
          .replaceAll('<br>', '')
          .replaceAll('&amp;', '&')
          .replaceAll('\n', '<br/>')

        detailsFormatted = NaagoUtil.topicHtmlToMarkdown(detailsFormatted)
        detailsFormatted = NaagoUtil.cutString(detailsFormatted, 2500)
        newNotice.details = detailsFormatted
        newNotice.date = newNotice.date * 1000
        newNotice.title = newNotice.tag ? newNotice.title : newNotice.title_full
        newNotice.tag = newNotice.tag
          ? `Notice: ${newNotice.tag.replaceAll('[', '').replaceAll(']', '')}`
          : 'Notice'
      }

      DbUtil.addNotices(newNotice)
      await NoticesUtil.sendNotice(newNotice)
    }
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
          `[NOTICES] Sending notice was NOT successful: ${err.message}`
        )
        continue
      }
    }
  }
}
