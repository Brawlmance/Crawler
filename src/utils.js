async function forEachAndWaitForAsyncs(array, callback) {
  const results = []
  for (let index = 0; index < array.length; index++) {
    results.push(await callback(array[index], index, array))
  }
  return results
}

module.exports = {
  forEachAndWaitForAsyncs,
}
