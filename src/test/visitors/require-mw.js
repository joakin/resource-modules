// @flow

const test = require('tape')

const {walk} = require('../../lib/analyze')
const requireMw = require('../../lib/visitors/require-mw')
const {fileAnalysis} = require('../../lib/visitors/types')

const files = {
  'a': {
    source: `
    var a = mw.banana + mw.phone.ring('ring')
    mw.yes.no(mw.config)
    `
  }
}

test('tracks usage of mw.<...> variables', (t) => {
  t.deepEqual(
    walk(requireMw, files.a.source, 'a'),
    fileAnalysis({
      mw_requires: ['mw.banana', 'mw.phone.ring', 'mw.yes.no', 'mw.config'],
      source: files.a.source
    })
  )
  t.end()
})
