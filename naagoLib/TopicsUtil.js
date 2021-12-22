const axios = require('axios')
const NaagoUtil = require('./NaagoUtil')
const DiscordUtil = require('./DiscordUtil')
const DbUtil = require('./DbUtil')
const GlobalUtil = require('./GlobalUtil')
const moment = require('moment')

module.exports = class TopicsUtil {
  static async getLast10() {
    try {
      const res = await axios.get('http://localhost:8081/lodestone/topics')
      return res?.data?.Topics ?? []
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async updateDb() {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm')}] Checking for topics`)

    const latestTopics = await this.getLast10()
    const newTopics = []

    for (const topic of latestTopics) {
      topic.date = topic.date * 1000
      if (await DbUtil.getTopicByTitle(topic.title, topic.date)) continue

      // Enrich topic
      let markdown = NaagoUtil.topicHtmlToMarkdown(topic.description)
      const parsedMarkdown = NaagoUtil.parseImageLinkFromMarkdown(markdown)
      markdown = parsedMarkdown?.markdown
      markdown = NaagoUtil.cutString(markdown, 2500)
      topic.description = markdown
      const links = parsedMarkdown?.links
      topic.banner = links?.length === 1 ? links[0] : topic.banner

      newTopics.push(topic)
    }

    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] New topics: ${newTopics.length}`
    )

    for (const newTopic of newTopics.reverse()) {
      DbUtil.addTopic(newTopic)
      await TopicsUtil.sentTopic(newTopic)
    }
  }

  static async sentTopic(topic) {
    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const setups = await DbUtil.getSetups('topics')
    if (!setups || setups?.length < 1) return

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id)
        if (!guild) continue
        const channel = await guild.channels.fetch(setup.channel_id)
        if (!channel) continue

        const embed = DiscordUtil.getTopicEmbed(topic)

        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.log(`[TOPICS] Sending topic was NOT successful: ${err.message}`)
        continue
      }
    }
  }
}
