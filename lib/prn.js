const {inspect} = require('util')

module.exports = function prn (x, out = false) {
  if (out) {
    console.dir(x, {depth: null, colors: true})
  } else {
    return inspect(x, {depth: null, colors: true})
  }
}
