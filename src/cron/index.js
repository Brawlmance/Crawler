const detectNewPatches = require('./detect_new_patches')
const clearOldData = require('./clear_old_data')
const fetchLeaderboard = require('./fetch_leaderboard')

module.exports = () => {
  setInterval(detectNewPatches, 1000 * 60 * 30)
  setInterval(clearOldData, 1000 * 60 * 15)

  console.log('Crawler started successfully')
  setTimeout(fetchLeaderboard, 100)
}
