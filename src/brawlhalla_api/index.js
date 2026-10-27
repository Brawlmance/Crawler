const https = require('https')
const utf8decodeRecursive = require('./utf8decode')
const config = require('../../config')

const brawlhallaApiUrl = 'https://api.brawlhalla.com'
const queriesPerSecond = 5 // 10 is the limit, but leaving space is a good idea
const windowMs = 1000 * 60 * 15
const queriesPerWindow = Math.floor(config.queries_per_15_min * 0.9) // Stay a bit under our 15 min quota
const rateLimitPauseMs = 30 * 1000

const queue = []
const sentTimestamps = [] // When each request in the current 15 min window was sent
var pausedUntil = false

function windowIsFull() {
  while (sentTimestamps.length && sentTimestamps[0] <= Date.now() - windowMs) sentTimestamps.shift()
  return sentTimestamps.length >= queriesPerWindow
}

setInterval(async () => {
  if (!queue.length) return false
  if (windowIsFull()) return false
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
    sentTimestamps.push(Date.now())
    let rawResponse = await httpsget(`${brawlhallaApiUrl}/${queueElm.url}?api_key=${config.brawlhalla_API_key}`)
    if (rawResponse.startsWith('<')) {
      throw new Error('Invalid JSON in response: ' + rawResponse)
    }
    response = utf8decodeRecursive(JSON.parse(rawResponse))
  } catch (error) {
    retry(queueElm, error)
    return undefined
  }
  if (response.error && response.error.code === 429) {
    console.warn(`[brawlhalla_api] Rate limited (${sentTimestamps.length} requests in the last 15 min). Pausing`)
    retry(queueElm, response.error.message, rateLimitPauseMs)
    return undefined
  }
  if (response.error) {
    queueElm.reject(response.error)
    return undefined
  }

  // Everything worked. Allow requests again
  if (firstRequestAfterPause) pausedUntil = false
  // Resolve promise returned by the public get function
  queueElm.resolve(response)
}, 1000 / queriesPerSecond)

function retry(queueElm, error, pauseMs = 5 * 1000) {
  if (++queueElm.tryN > 3) {
    queueElm.reject(new Error('Brawlhalla API error: ' + error))
    return false
  }
  pausedUntil = Date.now() + pauseMs
  queue.unshift(queueElm)
}


const options = {
    headers: { "User-Agent": "Brawlmance Crawler/1.0" }
};

function httpsget(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, options, resp => {
        let data = ''
        resp.on('data', chunk => {
          data += chunk
        })
        resp.on('end', async () => {
          resolve(data)
        })
      })
      .on('error', reject)
  })
}

function get(url) {
  let failTimeout
  return new Promise((resolve, reject) => {
    const queueElm = {
      tryN: 1,
      url,
      resolve,
      reject,
    }
    failTimeout = setTimeout(() => {
      const elmN = queue.indexOf(queueElm)
      if (elmN !== -1) queue.splice(elmN, 1)
      else console.warn('[brawlhalla_api] This should never happen: elm was not in queue')
      reject(new Error('Timeout: Brawlhalla API queue too long. Consider reducing queries_per_15_min in the config'))
    }, 5 * 60 * 1000)
    queue.push(queueElm)
  })
    .then(a => {
      clearTimeout(failTimeout)
      return a
    })
    .catch(err => {
      clearTimeout(failTimeout)
      throw err
    })
}

module.exports = {
  get,
}
