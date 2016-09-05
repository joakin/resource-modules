
const {isObjectAccess} = require('./ast-helpers')
const prn = require('../prn-ast')

module.exports = {
  AssignmentExpression (node, {data}/* , ancestors */) {
    if (
      isObjectAccess('mw', null, node.left)
    ) {
      const defined = prn(node.left, true)

      data.mw_defines = data.mw_defines || []

      if (data.mw_defines.indexOf(defined) !== -1) {
        throw new Error(`Module ${defined} already defined previously\n${prn(node)}`)
      } else {
        data.mw_defines.push(defined)
      }
    }
  }
}
