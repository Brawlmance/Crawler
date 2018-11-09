const https = require('https')
const utf8decodeRecursive = require('./utf8decode')
const config = require(process.env.PWD + '/config')

const brawlhallaApiUrl = 'https://api.brawlhalla.com'
const queriesPerSecond = 7 // 10 is the limit, but leaving space is a good idea

const queue = []
var pausedUntil = false

setInterval(async () => {
  if (!queue.length) return false
  var firstRequestAfterPause = false
  if (pausedUntil !== false) {
    if (pausedUntil > Date.now()) return false
    firstRequestAfterPause = true
    // Pause for another 5 seconds while this first request is done.
    // If everything goes well this time, we will resume
    pausedUntil = Date.now() + 5 * 1000
  }

  const queueElm = queue.shift()
  var response
  try {
    response = utf8decodeRecursive(JSON.parse(await httpsget(`${brawlhallaApiUrl}/${queueElm.url}?api_key=${config.brawlhalla_API_key}`)))
    if (response.error) throw response.error
  } catch (error) {
    retry(queueElm, error)
    return false
  }

  // Everything worked. Allow requests again
  if (firstRequestAfterPause) pausedUntil = false
  // Resolve promise returned by the public get function
  queueElm.resolve(response)
}, 1000 / queriesPerSecond)

setInterval(() => {
  if (queue.length > 250) console.warn(`The brawlhalla API queue is too long: ${queue.length} items. Consider reducing queries_per_15_min in the config`)
}, 1000 * 30)

function retry (queueElm, error) {
  console.log('Brawlhalla API error: ', error)
  pausedUntil = Date.now() + 5 * 1000 // Pause for 5 seconds
  queue.unshift(queueElm)
}

function httpsget (url) {
  return new Promise((resolve, reject) => {
    https.get(url, resp => {
      let data = ''
      resp.on('data', (chunk) => {
        data += chunk
      })
      resp.on('end', async () => {
        resolve(data)
      })
    }).on('error', reject)
  })
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
