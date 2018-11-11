const Player = require(process.env.PWD + '/models/Player')
const config = require(process.env.PWD + '/config')
const clans = require('./clans')
const legends = require('./legends')
const brawlhallaApi = require(process.env.PWD + '/brawlhalla_api')

async function updatePlayer (rankingplayer) {
  const player = await brawlhallaApi.get(`player/${rankingplayer.brawlhalla_id}/stats`)
  if (config.debug) console.debug(`Updating player ${rankingplayer.brawlhalla_id}`)
  if (!player.legends) {
    console.error(`Error updating player: ${player}`)
    return false
  }

  const updatesPromises = []

  updatesPromises.push(updatePlayerModel(player, rankingplayer))
  updatesPromises.push(clans.updatePlayerClan(player))
  player.legends.forEach(legend => {
    updatesPromises.push(legends.updatePlayerLegend(player.brawlhalla_id, legend, rankingplayer.tier))
  })

  await Promise.all(updatesPromises)
}

async function updatePlayerModel (player, rankingplayer) {
  const sortedLegends = player.legends.slice().sort((a, b) => { return b.xp - a.xp })
  const legend1 = sortedLegends[0].legend_id
  const legend2 = sortedLegends.length >= 2 ? sortedLegends[1].legend_id : 0
  const legend3 = sortedLegends.length >= 3 ? sortedLegends[2].legend_id : 0
  const values = {
    brawlhalla_id: rankingplayer.brawlhalla_id,
    name: rankingplayer.name,
    xp: player.xp,
    level: player.level,
    rank: rankingplayer.rank,
    tier: rankingplayer.tier,
    games: rankingplayer.games,
    wins: rankingplayer.wins,
    rating: rankingplayer.rating,
    region: rankingplayer.region,
    legend1: legend1,
    legend2: legend2,
    legend3: legend3,
    lastupdated: Math.floor(Date.now() / 1000)
  }
  const playerobj = await Player.findOne({ where: { brawlhalla_id: rankingplayer.brawlhalla_id } })
  if (playerobj) playerobj.update(values)
  else Player.create(values)
}

module.exports = {
  updatePlayer
}
