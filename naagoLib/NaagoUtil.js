const { from } = require('form-data')
const moment = require('moment')
const TurndownService = require('turndown')

module.exports = class NaagoUtil {
  static convertMsToDigitalClock(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000))
    const daysms = ms % (24 * 60 * 60 * 1000)
    const hours = Math.floor(daysms / (60 * 60 * 1000))
    const hoursms = ms % (60 * 60 * 1000)
    const minutes = Math.floor(hoursms / (60 * 1000))
    const minutesms = ms % (60 * 1000)
    const sec = Math.floor(minutesms / 1000)

    return (
      (days === 0 ? '' : `${days} d `) +
      (hours === 0 ? '' : `${hours} h `) +
      (minutes === 0 ? '' : `${minutes} m `) +
      `${sec} s`
    )
  }

  static addLeadingZeros(num, length) {
    const numString = num.toString()
    if (numString.length >= length) return numString
    else return '0'.repeat(length - numString.length) + numString
  }

  static getApostropheS(name) {
    return name.endsWith('s') ? "'" : "'s"
  }

  static capitalizeFirstLetter(string) {
    return (
      string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase()
    )
  }

  static prettifyPermissionArray(array) {
    const pretty = []
    array.forEach((element) => {
      const split = element.split('_')
      pretty.push(
        `${this.capitalizeFirstLetter(split[0])} ${this.capitalizeFirstLetter(
          split[1]
        )}`
      )
    })

    return pretty.join(', ')
  }

  static getWebsiteName(hostname) {
    if (hostname === 'github.com') return 'GitHub'
    else if (hostname === 'instagram.com') return 'Instagram'
    else if (hostname === 'reddit.com') return 'Reddit'
    else if (hostname === 'spotify.com') return 'Spotify'
    else if (hostname === 'steamcommunity.com') return 'Steam'
    else if (hostname === 'tiktok.com') return 'TikTok'
    else if (hostname === 'twitch.tv') return 'Twitch'
    else if (hostname === 'twitter.com') return 'Twitter'
    else return 'YouTube'
  }

  static cutString(string, length) {
    if (!string) return string
    else if (string.length > length)
      return string.substring(0, length - 3) + '...'
    else return string
  }

  static removeDuplicated(array) {
    return [...new Set(array)]
  }

  static removeIndicesFromArray(array, ...indices) {
    for (const [i, index] of indices.entries()) array.splice(index - i, 1)
    return array
  }
}
