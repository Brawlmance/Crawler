const https = require('https')
const Patch = require(process.env.PWD + '/models/Patch')
const utils = require(process.env.PWD + '/utils')

module.exports = () => {
  https.get('https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=291550&count=30&maxlength=300&format=json', resp => {
    let data = ''
    resp.on('data', (chunk) => {
      data += chunk
    })
    resp.on('end', async () => {
      const steampatches = JSON.parse(data)
      if (!steampatches.appnews || !steampatches.appnews.newsitems) return false // Something went wrong. Maybe steam is down?

      utils.forEachAndWaitForAsyncs(steampatches.appnews.newsitems, async (article) => {
        const isPatch = /(Patch|Update)/.test(article.title)
        if (!isPatch) return false // Not a patch, skip this article

        const patchTimestampExists = await Patch.findOne({ where: { timestamp: article.date } })
        if (patchTimestampExists) return false // Already in DB

        const submatches = /[0-9]+\.[0-9]+\.[0-9]+/.exec(article.title)
        const matches = /[0-9]+\.[0-9]+/.exec(article.title)
        let patchID = '?'
        if (submatches) {
          patchID = submatches[submatches.length - 1]
        } else if (matches) {
          patchID = matches[matches.length - 1]
        }

        const patchIdExists = await Patch.findOne({ where: { id: patchID } })
        await Patch.create({
          id: patchID,
          timestamp: article.date,
          changes: patchIdExists ? '0' : '1' // Got two timestamps for the same patch. Keep first one
        })
      })
    })
  }).on('error', (err) => {
    console.error('Http request error: ' + err.message)
  })
}
