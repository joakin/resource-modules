const {isI18n} = require('./ast-helpers')

module.exports = function i18nMatcher (node, state, ancestors, data) {
  if (
    isI18n(node)
  ) {
    const key = node.arguments[0].value

    data.messages = data.messages || []

    if (data.messages.indexOf(key) === -1) {
      data.messages.push(key)
    }
  }
}
