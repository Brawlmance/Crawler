const Player = require('../../models/Player')
const PlayerLegend = require('../../models/PlayerLegend')
const config = require('../../../config')
const clans = require('./clans')
const legends = require('./legends')
const brawlhallaApi = require('../../brawlhalla_api')

async function updatePlayer(playerFromApiRanking) {
  const playerEntity = await Player.findOne({ where: { brawlhalla_id: playerFromApiRanking.brawlhalla_id } })
  if (!playerEntity || playerEntity.games !== playerFromApiRanking.games) {
    if (config.debug) {
      console.debug(
        playerEntity
          ? `Updating player ${playerFromApiRanking.brawlhalla_id} data`
          : `Adding new player ${playerFromApiRanking.brawlhalla_id} data`
      )
    }
    await updatePlayerFromAPI(playerFromApiRanking, playerEntity)
    await updatePlayerRankedDataFromAPI(playerFromApiRanking)
    return {
      apiCallsMade: 2,
    }
  } else {
    await updatePlayerWithNoNewGames(playerFromApiRanking, playerEntity)
    return {
      apiCallsMade: 0,
    }
  }
}

async function updatePlayerWithNoNewGames(playerFromApiRanking, playerEntity) {
  if (config.debug) console.debug(`Player ${playerFromApiRanking.brawlhalla_id} had no new games`)
  // Some minor data like changing clans will no be updated until players play a game
  // This is a tradeoff for not having to ping the API for every single player
  playerEntity.update({
    brawlhalla_id: playerFromApiRanking.brawlhalla_id,
    name: playerFromApiRanking.name,
    rank: playerFromApiRanking.rank,
    tier: playerFromApiRanking.tier,
    games: playerFromApiRanking.games,
    wins: playerFromApiRanking.wins,
    rating: playerFromApiRanking.rating,
    region: playerFromApiRanking.region,
    lastupdated: Math.floor(Date.now() / 1000),
  })
  const day = Math.floor(Date.now() / 1000 / 60 / 60 / 24)
  await PlayerLegend.update(
    { day },
    {
      where: { brawlhalla_id: playerFromApiRanking.brawlhalla_id },
    }
  )
}

async function updatePlayerFromAPI(playerFromApiRanking, playerEntity) {
  const playerApiData = await brawlhallaApi.get(`player/${playerFromApiRanking.brawlhalla_id}/stats`)
  if (!playerApiData.legends) {
    console.error(`Error getting data for player ${playerFromApiRanking.brawlhalla_id}: ${playerApiData}`)
    return false
  }

  // Update DB data
  await updatePlayerModel(playerApiData, playerFromApiRanking, playerEntity)
  clans.updatePlayerClan(playerFromApiRanking.brawlhalla_id, playerApiData.clan)

  await Promise.all(
    playerApiData.legends.map(legendApiData =>
      legends.updatePlayerLegend(playerApiData.brawlhalla_id, legendApiData, playerFromApiRanking.tier)
    )
  )
}

async function updatePlayerModel(playerApiData, playerFromApiRanking, playerEntity) {
  const sortedLegends = playerApiData.legends.slice().sort((a, b) => {
    return b.xp - a.xp
  })
  const legend1 = sortedLegends[0].legend_id
  const legend2 = sortedLegends.length >= 2 ? sortedLegends[1].legend_id : 0
  const legend3 = sortedLegends.length >= 3 ? sortedLegends[2].legend_id : 0
  const values = {
    brawlhalla_id: playerFromApiRanking.brawlhalla_id,
    name: playerFromApiRanking.name,
    xp: playerApiData.xp,
    level: playerApiData.level,
    rank: playerFromApiRanking.rank,
    tier: playerFromApiRanking.tier,
    games: playerFromApiRanking.games,
    wins: playerFromApiRanking.wins,
    rating: playerFromApiRanking.rating,
    region: playerFromApiRanking.region,
    legend1: legend1,
    legend2: legend2,
    legend3: legend3,
    lastupdated: Math.floor(Date.now() / 1000),
  }
  if (playerEntity) await playerEntity.update(values)
  else await Player.create(values)
}

async function updatePlayerRankedDataFromAPI(playerFromApiRanking) {
  const playerApiRankedData = await brawlhallaApi.get(`player/${playerFromApiRanking.brawlhalla_id}/ranked`)
  if (!playerApiRankedData.legends || playerApiRankedData.error) return false

  const updatesPromises = []

  Player.update(
    {
      peak_rating: playerApiRankedData.peak_rating,
      ranked_games: playerApiRankedData.games,
      ranked_wins: playerApiRankedData.wins,
    },
    {
      where: { brawlhalla_id: playerFromApiRanking.brawlhalla_id },
    }
  )
  playerApiRankedData.legends.forEach(legendApiData => {
    updatesPromises.push(legends.updatePlayerRankedLegend(playerFromApiRanking.brawlhalla_id, legendApiData))
  })

  await Promise.all(updatesPromises)
}

module.exports = {
  updatePlayer,
}
