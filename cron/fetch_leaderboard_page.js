const brawlhallaApi = require(process.env.PWD + '/brawlhalla_api')
const Player = require(process.env.PWD + '/models/Player')
const PlayerLegend = require(process.env.PWD + '/models/PlayerLegend')
const Legend = require(process.env.PWD + '/models/Legend')
const Clan = require(process.env.PWD + '/models/Clan')
const ClanMember = require(process.env.PWD + '/models/ClanMember')
const Stat = require(process.env.PWD + '/models/Stat')
const config = require(process.env.PWD + '/config')
const utils = require(process.env.PWD + '/utils')

module.exports = async (executionIntervalInSeconds) => {
  const executionsPerDay = Math.floor(60 * 60 * 24 / executionIntervalInSeconds)
  const ms = Math.floor(Date.now() / 1000)
  const page = 1 + (Math.floor(executionsPerDay * ms / 24 / 60 / 60) % executionsPerDay) // Magic calculation of the page we're at
  if (config.debug) console.debug(`Getting page ${page}`)
  var ranking = await brawlhallaApi.get(`rankings/1v1/all/${page}`)

  if (ranking.error) {
    // Brawlhalla API down?
    console.error(`Brawlhalla API down?: ${ranking.error}`)
    return false
  }

  utils.forEachAndWaitForAsyncs(ranking, async player => {
    const playerStats = await brawlhallaApi.get(`player/${player.brawlhalla_id}/stats`)
    await updatePlayer(player, playerStats)
  })
}

async function updatePlayer (rankingplayer, player) {
  if (config.debug) console.debug(`Updating player ${rankingplayer.brawlhalla_id}`)
  if (!player.legends) {
    console.error(`Error updating player: ${player}`)
    return false
  }

  await updatePlayerModel(player, rankingplayer)

  utils.forEachAndWaitForAsyncs(player.legends, async legend => {
    if (!legend.legend_id || legend.legend_id === 17) return false // it doesn't actually exist
    await updateLegend(player.brawlhalla_id, rankingplayer.rating, rankingplayer.tier, legend)
  })

  if (player.clan) {
    await updateClan(player.clan, player.brawlhalla_id)
  }
}

async function updatePlayerModel (player, rankingplayer) {
  const sortedlegends = player.legends.sort((a, b) => { return b.xp - a.xp })
  const legend1 = sortedlegends[0].legend_id
  const legend2 = sortedlegends.length >= 2 ? sortedlegends[1].legend_id : 0
  const legend3 = sortedlegends.length >= 3 ? sortedlegends[2].legend_id : 0
  const playerobj = await Player.findOne({ where: { brawlhalla_id: rankingplayer.brawlhalla_id } })
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
  if (playerobj) playerobj.update(values)
  else Player.create(values)
}

async function updateLegend (brawlhallaId, rating, tier, legend) {
  const day = Math.floor(Date.now() / 1000 / 60 / 60 / 24)
  legend.brawlhalla_id = brawlhallaId
  legend.day = day

  const oldlegend = await PlayerLegend.findOne({
    where: { brawlhalla_id: brawlhallaId, legend_id: legend.legend_id },
    order: [
      ['day', 'DESC']
    ]
  })

  if (!oldlegend) {
    addNewLegend(legend) // It might be a new legend
    await PlayerLegend.create(legend)
  } else {
    await updateLegendStats(brawlhallaId, legend, oldlegend, day, rating, tier)
    await oldlegend.update(legend)
  }
}

async function updateLegendStats (brawlhallaId, legend, oldlegend, day, rating, tier) {
  const diff = JSON.parse(JSON.stringify(legend));
  [
    'damagedealt', 'damagetaken', 'kos', 'falls', 'suicides', 'teamkos', 'matchtime', 'games', 'wins',
    'damageunarmed', 'damagethrownitem', 'damageweaponone', 'damageweapontwo', 'damagegadgets', 'kounarmed',
    'kothrownitem', 'koweaponone', 'koweapontwo', 'kogadgets', 'timeheldweaponone', 'timeheldweapontwo'
  ].forEach(key => {
    diff[key] = legend[key] - oldlegend[key]
  })

  if (diff.games <= 0) return false

  if (config.debug) console.debug(`statsToDB for legend ${diff.legend_id} from player ${brawlhallaId} (${diff.games} new games)`)
  await statsToDB(diff, day, 'all')
  await statsToDB(diff, day, tier.replace(/(.*) (\d)/, '$1'))
}

async function addNewLegend (legend) {
  const isindb = await Legend.count({ where: { legend_id: legend.legend_id } })
  if (isindb > 0) return false
  console.log(`Adding new legend ${legend.legend_id}`)
  const newLegend = await brawlhallaApi.get(`legend/${legend.legend_id}`)
  if (!newLegend.legend_id) {
    console.error('Something went wrong while trying to get info from a new legend: ', newLegend)
    return false
  }
  await Legend.create(newLegend)
}

async function updateClan (clan, brawlhallaId) {
  const clanFromDB = await Clan.findOne({ where: { clan_id: clan.clan_id } })
  if (clanFromDB) {
    clanFromDB.update(clan)
  } else {
    Clan.create(clan)
  }

  const memberData = {
    clan_id: clan.clan_id,
    brawlhalla_id: brawlhallaId,
    personal_xp: clan.personal_xp
  }
  const member = await ClanMember.findOne({ where: { clan_id: memberData.clan_id } })
  if (member) {
    await member.update(memberData)
  } else {
    await ClanMember.create(memberData)
  }
}

async function statsToDB (diff, day, tier) {
  const statsData = {
    legend_id: diff.legend_id,
    day: day,
    tier: tier
  }
  const statsfromdb = await Stat.findOne({ where: statsData })
  if (!statsfromdb) {
    await Stat.create(Object.assign(diff, statsData))
    return false
  }

  [
    'damagedealt', 'damagetaken', 'kos', 'falls', 'suicides', 'teamkos', 'matchtime', 'games', 'wins',
    'damageunarmed', 'damagethrownitem', 'damageweaponone', 'damageweapontwo', 'damagegadgets', 'kounarmed',
    'kothrownitem', 'koweaponone', 'koweapontwo', 'kogadgets', 'timeheldweaponone', 'timeheldweapontwo'
  ].forEach(key => {
    statsfromdb[key] += diff[key]
  })
  await statsfromdb.save()
}
