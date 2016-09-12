// @flow

const {inspect} = require('util')

module.exports = function prn (x: mixed, out: boolean = false): string|void {
  if (out) {
    console.dir(x, {depth: null, colors: true})
  } else {
    return inspect(x, {depth: null, colors: true})
  }
}
