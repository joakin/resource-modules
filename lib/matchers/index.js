
const matchers = {
  CallExpression: [
    require('./require'),
    require('./define'),
    require('./template'),
    require('./i18n')
  ],
  MemberExpression: [
    require('./require-mw')
  ],
  AssignmentExpression: [
    require('./define-mw')
  ]
}

module.exports = (data, file) =>
  Object.keys(matchers).reduce((a, k) => {
    let fns = matchers[k]
    a[k] = (node, st, ancestors) =>
      fns.forEach((fn) => {
        try {
          fn(node, st, ancestors, data)
        } catch (e) {
          console.error(`\nOn file: ${file}`)
          console.error(e.message)
        }
      })
    return a
  }, {})
