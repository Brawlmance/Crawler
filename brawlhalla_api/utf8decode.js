const utf8 = require('utf8')

function recursiveUtf8Decode (elm) {
  if (typeof elm === 'string') {
    try {
      return utf8.decode(elm)
    } catch (error) {
      // UTF8 decoding error
    }
  }

  if (typeof elm === 'object') {
    Object.keys(elm).forEach(key => {
      elm[key] = recursiveUtf8Decode(elm[key])
    })
    return elm
  }

  return elm
}

module.exports = recursiveUtf8Decode
