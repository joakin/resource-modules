const {inspect} = require('util')

module.exports = function prn (node, out = false) {
  if (out) {
    console.dir(node, {depth: null, colors: true})
  } else {
    return inspect(node, {depth: null, colors: true})
  }
}
