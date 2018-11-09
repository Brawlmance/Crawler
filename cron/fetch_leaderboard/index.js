const brawlhallaApi = require(process.env.PWD + '/brawlhalla_api')
const config = require(process.env.PWD + '/config')
const utils = require(process.env.PWD + '/utils')
const players = require('./players')

async function cronFn (executionIntervalInSeconds) {
  const executionsPerDay = Math.floor(60 * 60 * 24 / executionIntervalInSeconds)
  const ms = Math.floor(Date.now() / 1000)
  const page = 1 + (Math.floor(executionsPerDay * ms / 24 / 60 / 60) % executionsPerDay) // Magic calculation of the page we're at

  var ranking = await brawlhallaApi.get(`rankings/1v1/all/${page}`)
  if (config.debug) console.debug(`Processing page ${page}`)

  if (ranking.error) {
    // Brawlhalla API down?
    console.error(`Brawlhalla API down?: ${ranking.error}`)
    return false
  }

  await utils.forEachAndWaitForAsyncs(ranking, async rankingplayer => {
    await players.updatePlayer(rankingplayer)
  })

  if (config.debug) console.debug(`Finished processing page ${page}`)
}

module.exports = cronFn
