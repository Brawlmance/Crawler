const fs = require('fs')

if (!fs.existsSync('config.json')) {
  console.error('Please create a config.json file using the template from config.example.json')
  process.exit(1)
}

const configJson = fs.readFileSync('config.json', 'utf8')
const configObject = JSON.parse(configJson)

if (!configObject.brawlhalla_API_key || configObject.brawlhalla_API_key.length === 0) {
  throw new Error('No configured Brawlhalla API key')
}

module.exports = configObject
