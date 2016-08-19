const {isTemplate} = require('./ast-helpers')
const prn = require('../prn-ast')
const equal = require('deep-equal')

module.exports = function templateMatcher (node, state, ancestors, data) {
  if (
    isTemplate(node)
  ) {
    const tpl = {
      module: node.arguments[0].value,
      fileName: node.arguments[1].value
    }

    data.templates = data.templates || []

    if (data.templates.some((t) => equal(t, tpl))) {
      throw new Error(`Template ${JSON.stringify(tpl)} already required previously\n\n${prn(node)}`)
    } else {
      data.templates.push(tpl)
    }
  }
}

