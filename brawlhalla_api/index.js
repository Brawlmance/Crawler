const https = require('https')
const utf8decode = require('./utf8decode')
const config = require(process.env.PWD + '/config')

const brawlhallaApiUrl = 'https://api.brawlhalla.com'
const queriesPerSecond = 9 // 10 is the limit

const queue = []
var pausedUntil = 0

setInterval(() => {
  if (!queue.length) return false
  if (pausedUntil > Date.now()) return false

  const queueElm = queue.shift()
  httpsget(`${brawlhallaApiUrl}/${queueElm.url}?api_key=${config.brawlhalla_API_key}`, async data => {
    const response = utf8decode(JSON.parse(data))
    if (response.error && response.error.code === 429) {
      retry(queueElm, response.error)
      return false
    }
    queueElm.resolve(response)
  }, err => {
    retry(queueElm, err)
  })
}, 1000 / queriesPerSecond)

setInterval(() => {
  if (queue.length > 150) console.warn(`The brawlhalla API queue is too long: ${queue.length} items. Consider reducing queries_per_15_min in the config`)
}, 1000 * 30)

function retry (queueElm, error) {
  console.log(error)
  pausedUntil = Date.now() + 5 * 1000 // Pause for 5 seconds
  queue.unshift(queueElm)
}

function httpsget (url, callback, error) {
  https.get(url, resp => {
    let data = ''
    resp.on('data', (chunk) => {
      data += chunk
    })
    resp.on('end', async () => {
      callback(data)
    })
  }).on('error', error)
}

function get (url) {
  const promise = new Promise((resolve) => {
    queue.push({
      url,
      resolve
    })
  })
  return promise
}

module.exports = {
  get
}
