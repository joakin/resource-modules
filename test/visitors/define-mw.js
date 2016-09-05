const test = require('tape')

const {walk} = require('../../lib/analyze')
const defineMw = require('../../lib/visitors/define-mw')

const files = {
  'a': {
    source: `
    var a = mw.banana = 1
    1 + (mw.phone.ring = function () {})
    mw.yes.no = banana
    `
  }
}

test('tracks definition of mw.<...> variables', (t) => {
  t.deepEqual(
    walk(defineMw, files, 'a').a,
    {
      mw_defines: ['mw.banana', 'mw.phone.ring', 'mw.yes.no'],
      source: files.a.source
    }
  )
  t.end()
})
