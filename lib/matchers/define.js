const {isDefine} = require('./ast-helpers')
const prn = require('../prn-ast')

module.exports = function defineMatcher (node, state, ancestors, data) {
  if (
    isDefine(node)
  ) {
    const defined = node.arguments[0].value

    data.defines = data.defines || []

    if (data.defines.indexOf(defined) !== -1) {
      throw new Error(`Module ${defined} already defined previously\n\n${prn(node)}`)
    } else {
      data.defines.push(defined)
    }
  }
}
