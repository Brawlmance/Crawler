const steamPatches = require('./steam_patches')
const clearOldData = require('./clear_old_data')
const fetchLeaderboardPage = require('./fetch_leaderboard_page')
const config = require(process.env.PWD + '/config')

module.exports = () => {
  setInterval(steamPatches, 1000 * 60)
  setInterval(clearOldData, 1000 * 60)

  const queriesPerLeaderboardRun = 51 // 1 for leaderboard + 50 for profiles
  const executionsPerSecond = config.queries_per_15_min / 60 / 15 / queriesPerLeaderboardRun
  const margin = 0.9 // Reduce our theoretical max limit a bit, to avoid hitting rate limits
  const executionIntervalInSeconds = 1 / (executionsPerSecond * margin)
  setInterval(fetchLeaderboardPage, 1000 * executionIntervalInSeconds, executionIntervalInSeconds)

  console.log('Crawler started successfully')
}
