const {isRequire, isMwLoader} = require('./ast-helpers')
const prn = require('../prn-ast')

module.exports = {
  CallExpression (node, data, ancestors) {
    if (
      isRequire(node)
    ) {
      const required = node.arguments[0].value

      data.requires = data.requires || []
      data.async_requires = data.async_requires || []

      let where = data.requires
      if (ancestors.filter(isMwLoader).length > 0) {
        where = data.async_requires
      }

      if (where.indexOf(required) !== -1) {
        throw new Error(`Module ${required} already required previously\n${prn(node)}`)
      } else {
        where.push(required)
      }
    }
  }
}
