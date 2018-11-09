const brawlhallaApi = require(process.env.PWD + '/brawlhalla_api')
const Player = require(process.env.PWD + '/models/Player')
const PlayerLegend = require(process.env.PWD + '/models/PlayerLegend')
const Legend = require(process.env.PWD + '/models/Legend')
const Clan = require(process.env.PWD + '/models/Clan')
const ClanMember = require(process.env.PWD + '/models/ClanMember')
const Stat = require(process.env.PWD + '/models/Stat')

module.exports = async (executionIntervalInSeconds) => {
  const executionsPerDay = Math.floor(60 * 60 * 24 / executionIntervalInSeconds)
  const ms = Math.floor(Date.now() / 1000)
  const page = 1 + (Math.floor(executionsPerDay * ms / 24 / 60 / 60) % executionsPerDay) // Magic calculation of the page we're at
  console.debug(`Getting page ${page}`)
  var ranking = await brawlhallaApi.get(`rankings/1v1/all/${page}`)

  if (ranking.error) {
    // Brawlhalla API down?
    console.log(`Brawlhalla API down?: ${ranking.error}`)
    return false
  }

  ranking.forEach(async player => {
    const playerStats = await brawlhallaApi.get(`player/${player.brawlhalla_id}/stats`)
    updatePlayer(player, playerStats)
  })
}

function updatePlayer (rankingplayer, player) {
  console.debug(`Updating player ${rankingplayer.brawlhalla_id}`)
  if (!player.legends) {
    console.log(`Error updating player: ${player}`)
    return false
  }

  player.legends = player.legends.sort((a, b) => { return b.xp - a.xp })
  const legend1 = player.legends[0].legend_id
  const legend2 = player.legends.length >= 2 ? player.legends[1].legend_id : 0
  const legend3 = player.legends.length >= 3 ? player.legends[2].legend_id : 0
  Player.findOne({ where: { brawlhalla_id: rankingplayer.brawlhalla_id } }).then((obj) => {
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
    if (obj) obj.update(values)
    else Player.create(values)
  })

  player.legends.forEach(legend => {
    if (!legend.legend_id || legend.legend_id === 17) return false // it doesn't actually exist
    updateLegend(rankingplayer, legend)
  })

  if (player.clan) {
    updateClan(player.clan, player.brawlhalla_id)
  }
}

async function updateLegend (rankingplayer, legend) {
  console.debug(`Updating legend ${legend.legend_id} for ${rankingplayer.brawlhalla_id}`)
  const day = Math.floor(Date.now() / 1000 / 60 / 60 / 24)

  const oldlegend = await PlayerLegend.findOne({
    where: { brawlhalla_id: rankingplayer.brawlhalla_id, legend_id: legend.legend_id },
    order: [
      ['day', 'DESC']
    ]
  })

  if (!oldlegend) {
    // It might be a new legend
    addNewLegend(legend)
  } else {
    const diff = {}
    Object.keys(legend).forEach(key => {
      diff[key] = legend[key] - oldlegend[key]
    })
    diff.xp = legend.xp
    diff.level = legend.level

    if (diff.games > 0) {
      statsToDB(diff, 'all', rankingplayer.rating * diff.games, day)
      statsToDB(diff, rankingplayer.tier.replace(/(.*) (\d)/, '1'), rankingplayer.rating * diff.games, day)
    }

    await PlayerLegend.destroy({ where: { brawlhalla_id: rankingplayer.brawlhalla_id, legend_id: legend.legend_id } })
  }

  legend.brawlhalla_id = rankingplayer.brawlhalla_id
  legend.day = day
  await PlayerLegend.create(legend)
}

async function addNewLegend (legend) {
  const isindb = await Legend.findOne({ where: { legend_id: legend.legend_id } })
  if (isindb) return false
  console.debug(`Adding new legend ${legend.legend_id}`)
  const newLegend = await brawlhallaApi.get(`legend/${legend.legend_id}`)
  if (!newLegend.legend_id) {
    console.error('Something went wrong while trying to get info from a new legend: ', newLegend)
    return false
  }
  Legend.create(newLegend)
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
    member.update(memberData)
  } else {
    ClanMember.create(memberData)
  }
}

async function statsToDB (legend, tier, elo, day) {
  console.debug(`statsToDB for legend ${legend.legend_id}`)
  const statsData = {
    legend_id: legend.legend_id,
    day: day,
    tier: tier
  }
  const statsfromdb = await Stat.findOne({ where: statsData })
  if (statsfromdb) {
    Object.keys(legend).forEach(key => {
      if (statsfromdb[key]) statsfromdb[key] += legend[key]
    })
    statsfromdb.elo += elo
    statsfromdb.save()
  } else {
    Stat.create(statsData)
  }
}
