const {isObjectAccess} = require('./ast-helpers')
const prn = require('../prn-ast')

module.exports = {
  MemberExpression (node, {data}, ancestors) {
    if (
      isObjectAccess('mw', null, node) &&
      ( // Get only full member expressions and not the sub-children
        (ancestors && ancestors.length > 1 &&
         ancestors[ancestors.length - 2].type !== 'MemberExpression') ||
        (ancestors.length === 0)
      )
    ) {
      const used = prn(node, true)

      data.mw_requires = data.mw_requires || []

      if (data.mw_requires.indexOf(used) === -1) {
        data.mw_requires.push(used)
      }
    }
  }
}

