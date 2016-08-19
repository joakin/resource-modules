const {isObjectAccess} = require('./ast-helpers')

module.exports = function requireMwMatcher (node, state, ancestors, data) {
  if (
    isObjectAccess('mw', null, node)
  ) {
    const used = 'mw.' + node.property.name

    data.mw_requires = data.mw_requires || []

    if (data.mw_requires.indexOf(used) === -1) {
      data.mw_requires.push(used)
    }
  }
}

