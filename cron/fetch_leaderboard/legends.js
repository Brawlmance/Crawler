const PlayerLegend = require(process.env.PWD + '/models/PlayerLegend')
const PlayerRankedLegend = require(process.env.PWD + '/models/PlayerRankedLegend')
const Legend = require(process.env.PWD + '/models/Legend')
const Stat = require(process.env.PWD + '/models/Stat')
const brawlhallaApi = require(process.env.PWD + '/brawlhalla_api')
const config = require(process.env.PWD + '/config')

async function updatePlayerLegend (brawlhallaId, legendApiData, tier) {
  if (!legendApiData.legend_id || legendApiData.legend_id === 17) return false // it doesn't actually exist
  if (legendApiData.games === 0) return false // The player hasn't used this legend

  const day = Math.floor(Date.now() / 1000 / 60 / 60 / 24)
  legendApiData.brawlhalla_id = brawlhallaId
  legendApiData.day = day

  const legendEntity = await PlayerLegend.findOne({
    where: { brawlhalla_id: brawlhallaId, legend_id: legendApiData.legend_id }
  })

  if (!legendEntity) {
    PlayerLegend.create(legendApiData)
    await addNewLegend(legendApiData.legend_id) // Create new legend db entry if we have never seen it before
  } else if (legendEntity.games !== legendApiData.games) {
    updateLegendStats(brawlhallaId, legendApiData, legendEntity, day, tier)
    legendEntity.update(legendApiData)
  }
}

async function updateLegendStats (brawlhallaId, legendApiData, legendEntity, day, tier) {
  const diff = {}
  const statColumns = [
    'damagedealt', 'damagetaken', 'kos', 'falls', 'suicides', 'teamkos', 'matchtime', 'games', 'wins',
    'damageunarmed', 'damagethrownitem', 'damageweaponone', 'damageweapontwo', 'damagegadgets', 'kounarmed',
    'kothrownitem', 'koweaponone', 'koweapontwo', 'kogadgets', 'timeheldweaponone', 'timeheldweapontwo'
  ]
  statColumns.forEach(key => {
    diff[key] = parseInt(legendApiData[key]) - parseInt(legendEntity[key])
  })

  if (legendApiData.games < legendEntity.games) {
    console.error(`API has less games than DB: ${legendApiData}`)
    return false
  }

  if (config.debug) console.debug(`updateLegendStats for legend ${legendApiData.legend_id} from player ${brawlhallaId} (${legendApiData.games - legendEntity.games} new games)`)
  updateStatsTableWithDiff(diff, legendApiData.legend_id, day, 'all')
  updateStatsTableWithDiff(diff, legendApiData.legend_id, day, tier.replace(/(.*) (\d)/, '$1'))
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

const seenLegends = {}
async function addNewLegend (legendId) {
  if (seenLegends[legendId]) return undefined // Cached: legend already seen

  const isindb = await Legend.count({ where: { legend_id: legendId } })
  if (isindb === 0) {
    console.log(`Adding new legend ${legendId}`)
    const newLegend = await brawlhallaApi.get(`legend/${legendId}`)
    if (!newLegend.legend_id) {
      console.error('Something went wrong while trying to get info from a new legend: ', newLegend)
      return undefined
    }
    await Legend.create(newLegend)
  }
  seenLegends[legendId] = true
}

async function updatePlayerRankedLegend (brawlhallaId, legendApiData) {
  if (!legendApiData.legend_id || legendApiData.legend_id === 17) return false // it doesn't actually exist
  if (legendApiData.games === 0) return false // The player hasn't used this legend

  const day = Math.floor(Date.now() / 1000 / 60 / 60 / 24)
  legendApiData.brawlhalla_id = brawlhallaId
  legendApiData.day = day

  const legendEntity = await PlayerRankedLegend.findOne({
    where: { brawlhalla_id: brawlhallaId, legend_id: legendApiData.legend_id }
  })

  if (!legendEntity) {
    PlayerRankedLegend.create(legendApiData)
  } else if (legendEntity.games !== legendApiData.games) {
    legendEntity.update(legendApiData)
  }
}

module.exports = {
  updatePlayerLegend,
  updatePlayerRankedLegend
}
