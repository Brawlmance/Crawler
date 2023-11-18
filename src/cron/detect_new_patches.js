const https = require('https')
const Patch = require('../models/Patch')
const utils = require('../utils')

module.exports = () => {
  https
    .get('https://cms.brawlhalla.com/wp-json/wp/v2/posts?per_page=20', resp => {
      let data = ''
      resp.on('data', chunk => {
        data += chunk
      })
      resp.on('end', async () => {
        const newsPosts = JSON.parse(data)
        if (!newsPosts || !newsPosts.length) return false // Something went wrong. Maybe website is down?

        utils.forEachAndWaitForAsyncs(newsPosts, async article => {
          const articleTitle = article.title.rendered
          const articleDate = Number(new Date(article.date)) / 1000

          const isPatch = /(Patch|Update)/.test(articleTitle)
          if (!isPatch) return false // Not a patch, skip this article

          const patchTimestampExists = await Patch.findOne({ where: { timestamp: articleDate } })
          if (patchTimestampExists) return false // Already in DB

          const submatches = /[0-9]+\.[0-9]+\.[0-9]+/.exec(articleTitle)
          const matches = /[0-9]+\.[0-9]+/.exec(articleTitle)
          let patchID = '?'
          if (submatches) {
            patchID = submatches[submatches.length - 1]
          } else if (matches) {
            patchID = matches[matches.length - 1]
          }

          const patchIdExists = await Patch.findOne({ where: { id: patchID } })
          await Patch.create({
            id: patchID,
            timestamp: articleDate,
            changes: patchIdExists ? '0' : '1', // Got two timestamps for the same patch. Keep first one
          })
        })
      })
    })
    .on('error', err => {
      console.error('Http request error: ' + err.message)
    })
}
