const PlayerLegend = require(process.env.PWD + '/models/PlayerLegend')
const Legend = require(process.env.PWD + '/models/Legend')
const Stat = require(process.env.PWD + '/models/Stat')
const brawlhallaApi = require(process.env.PWD + '/brawlhalla_api')
const config = require(process.env.PWD + '/config')

async function updatePlayerLegend (brawlhallaId, legend, tier) {
  if (!legend.legend_id || legend.legend_id === 17) return false // it doesn't actually exist
  if (legend.games === 0) return false // The player hasn't used this legend

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
    PlayerLegend.create(legend)
    await addNewLegend(legend.legend_id) // It might be a new legend
  } else {
    updateLegendStats(brawlhallaId, legend, oldlegend, day, tier)
    oldlegend.update(legend)
  }
}

async function updateLegendStats (brawlhallaId, legend, oldlegend, day, tier) {
  const diff = {}
  const statColumns = [
    'damagedealt', 'damagetaken', 'kos', 'falls', 'suicides', 'teamkos', 'matchtime', 'games', 'wins',
    'damageunarmed', 'damagethrownitem', 'damageweaponone', 'damageweapontwo', 'damagegadgets', 'kounarmed',
    'kothrownitem', 'koweaponone', 'koweapontwo', 'kogadgets', 'timeheldweaponone', 'timeheldweapontwo'
  ]
  statColumns.forEach(key => {
    diff[key] = parseInt(legend[key]) - parseInt(oldlegend[key])
  })

  if (diff.games <= 0) return false

  if (config.debug) console.debug(`updateLegendStats for legend ${legend.legend_id} from player ${brawlhallaId} (${legend.games} games, ${oldlegend.games} before)`)
  updateStatsTableWithDiff(diff, legend.legend_id, day, 'all')
  updateStatsTableWithDiff(diff, legend.legend_id, day, tier.replace(/(.*) (\d)/, '$1'))
}

async function updateStatsTableWithDiff (diff, legendId, day, tier) {
  const statsData = {
    legend_id: legendId,
    day: day,
    tier: tier
  }
  const statsfromdb = await Stat.findOne({ where: statsData })
  if (!statsfromdb) {
    await Stat.create(Object.assign(diff, statsData))
    return false
  }

  await Stat.increment(diff, { where: statsData })
}

async function addNewLegend (legendId) {
  const isindb = await Legend.count({ where: { legend_id: legendId } })
  if (isindb > 0) return false
  console.log(`Adding new legend ${legendId}`)
  const newLegend = await brawlhallaApi.get(`legend/${legendId}`)
  if (!newLegend.legend_id) {
    console.error('Something went wrong while trying to get info from a new legend: ', newLegend)
    return false
  }
  await Legend.create(newLegend)
}

module.exports = {
  updatePlayerLegend
}
