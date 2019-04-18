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
    const now = Math.floor(Date.now() / 1000)
    let page
    let rankingPos = await RankingProgress.findByPk('1v1/all')
    if (rankingPos === null) {
      page = 1
      rankingPos = RankingProgress.create({
        type: '1v1/all',
        first_page_crawl_ts: now,
        page
      })
    } else {
      if (now - rankingPos.first_page_crawl_ts > resetRankingPageSeconds) {
        page = 1
        rankingPos.update({ page, first_page_crawl_ts: now })
      } else {
        page = rankingPos.page + 1
        rankingPos.update({ page })
      }
    }

    if (config.debug) console.debug(`Processing page ${page}`)
    apiCallsMade++
    var ranking = await brawlhallaApi.get(`rankings/1v1/all/${page}`)

    if (ranking.error) {
      // Brawlhalla API down?
      console.error(`Brawlhalla API down?: ${ranking.error}`)
    } else {
      const playerUpdates = await utils.forEachAndWaitForAsyncs(ranking, players.updatePlayer)
      apiCallsMade += playerUpdates.reduce((tot, curr) => tot + (curr.apiCallMade ? 1 : 0), 0)
      if (config.debug) console.debug(`Finished processing page ${page}. ${apiCallsMade} API calls made`)
    }
  } catch (e) {
    console.error(e)
  }

  const executionsPerSecond = config.queries_per_15_min / 60 / 15 / apiCallsMade
  const margin = 0.9 // Reduce our theoretical max limit a bit, to avoid hitting rate limits
  const executionIntervalInSeconds = 1 / (executionsPerSecond * margin)

  const msElapsed = Date.now() - initialTs
  setTimeout(cronFn, 1000 * executionIntervalInSeconds - msElapsed)
}

module.exports = cronFn
