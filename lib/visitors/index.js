
// Map String (Node -> {data, file} -> List Node)
module.exports = combineVisitors([
  require('./require'),
  require('./define'),
  require('./template'),
  require('./i18n'),
  require('./require-mw'),
  require('./define-mw')
])

function combineVisitors (visitors) {
  let byKey = visitors.reduce((a, obj) => {
    Object.keys(obj).forEach((nodeType) => {
      const visitor = obj[nodeType]
      a[nodeType] = a[nodeType] || []
      a[nodeType].push(visitor)
    })
    return a
  }, {})
  return Object.keys(byKey).reduce((a, nodeType) => {
    let visitors = byKey[nodeType]
    a[nodeType] = (node, st, ancestors) =>
      visitors.forEach((visitor) => {
        try {
          visitor(node, st, ancestors)
        } catch (e) {
          console.error(`\nOn file: ${st.file}`)
          console.error(e.message)
        }
      })
    return a
  }, {})
}
