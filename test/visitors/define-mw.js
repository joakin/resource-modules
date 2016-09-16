// @flow

const test = require('tape')

const {walk} = require('../../lib/analyze')
const defineMw = require('../../lib/visitors/define-mw')
const {fileAnalysis} = require('../../lib/visitors/types')

const files = {
  'a': {
    source: `
    var a = mw.banana = 1
    1 + (mw.phone.ring = function () {})
    mw.yes.no = banana
    `
  },
  'b': {
    source: `
    mw.banana = {
      phone: 1,
      ring: function () {}
    }
    `
  }
}

test('tracks definition of mw.<...> variables', (t) => {
  t.deepEqual(
    walk(defineMw, files.a.source, 'a'),
    fileAnalysis({
      mw_defines: ['mw.banana', 'mw.phone.ring', 'mw.yes.no'],
      source: files.a.source
    })
  )
  t.end()
})

test('tracks definition of mw.<...> as objects', (t) => {
  t.deepEqual(
    walk(defineMw, files.b.source, 'b'),
    fileAnalysis({
      mw_defines: ['mw.banana', 'mw.banana.phone', 'mw.banana.ring'],
      source: files.b.source
    })
  )
  t.end()
})
