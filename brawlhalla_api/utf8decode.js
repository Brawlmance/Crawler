const utf8 = require('utf8')

function recursiveUtf8Decode (elm) {
  if (typeof elm === 'string') return utf8.decode(elm)
  if (Array.isArray(elm)) return elm.map(child => recursiveUtf8Decode(child))
  if (typeof val === 'object') {
    const newObj = {}
    for (var key in elm) {
      if (elm.hasOwnProperty(key)) newObj[key] = recursiveUtf8Decode(elm[key])
    }
    return newObj
  }
  return elm
}

module.exports = recursiveUtf8Decode
