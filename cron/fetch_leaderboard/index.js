const RankingProgress = require(process.env.PWD + '/models/RankingProgress')
const brawlhallaApi = require(process.env.PWD + '/brawlhalla_api')
const config = require(process.env.PWD + '/config')
const utils = require(process.env.PWD + '/utils')
const players = require('./players')

async function cronFn () {
  const resetRankingPageSeconds = 60 * 60 * 12 // 12h
  const initialTs = Date.now()

  let apiCallsMade = 0
  try {
    // Get next page to crawl
    const now = Math.floor(Date.now() / 1000)
    let page = 1
    let rankingPos = await RankingProgress.findByPk('1v1/all')
    if (rankingPos === null) {
      rankingPos = RankingProgress.create({
        type: '1v1/all',
        first_page_crawl_ts: now,
        page: 0
      })
    } else {
      page = rankingPos.page + 1
    }

    // Process page
    if (config.debug) console.debug(`Processing page ${page}`)
    apiCallsMade++
    var ranking = await brawlhallaApi.get(`rankings/1v1/all/${page}`)

    if (ranking.error) {
      console.error(`Brawlhalla API down?: ${ranking.error}`)
    } else {
      const playerUpdates = await utils.forEachAndWaitForAsyncs(ranking, players.updatePlayer)
      apiCallsMade += playerUpdates.reduce((tot, curr) => tot + curr.apiCallsMade, 0)
      if (config.debug) console.debug(`Finished processing page ${page}. ${apiCallsMade} API calls made`)
    }

    // Update page position in db
    if (now - rankingPos.first_page_crawl_ts > resetRankingPageSeconds) {
      RankingProgress.update({ page: 0, first_page_crawl_ts: now }, { where: { type: '1v1/all' } })
    } else {
      RankingProgress.update({ page }, { where: { type: '1v1/all' } })
    }
  } catch (e) {
    console.error(e)
  }

  const msPerApiCall = 1000 * 60 * 15 / config.queries_per_15_min
  const margin = 0.9 // Reduce our theoretical max limit a bit, to avoid hitting rate limits
  const msToWait = (msPerApiCall / margin) * apiCallsMade

  const msElapsed = Date.now() - initialTs
  if (config.debug) console.log(`To Wait: ${msToWait / 1000}s / Elapsed: ${msElapsed / 1000}s`)
  setTimeout(cronFn, msToWait - msElapsed)
}

module.exports = cronFn
