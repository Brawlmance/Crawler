const fs = require('fs')

const configJson = fs.readFileSync('config.json', 'utf8')
const configObject = JSON.parse(configJson)

if (!configObject.brawlhalla_API_key || configObject.brawlhalla_API_key.length === 0) {
  throw new Error('No configured Brawlhalla API key')
}

module.exports = configObject
