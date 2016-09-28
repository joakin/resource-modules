// @flow

const test = require('tape')

const {walk} = require('../../lib/analyze')
const requirev = require('../../lib/visitors/require')
const {fileAnalysis} = require('../../lib/visitors/types')

const files = {
  'a': {
    source: `
    var a = M.require('a')
    var b = require('b')
    var c = mw.mobileFrontend.require('c')
    `
  },
  'aa': {
    source: `var a = M.require(a)`
  },
  'bb': {
    source: `var b = require(b)`
  },
  'cc': {
    source: `var c = mw.mobileFrontend.require(c)`
  },
  'd': {
    source: `
    mw.loader.using('resourceloadermodule').done(() => {
      var a = M.require('a')
      var b = require('b')
      var c = mw.mobileFrontend.require('c')
    })
    loader.loadModule('resourceloadermodule').done(() => {
      var d = M.require('d')
      var e = require('e')
      var f = mw.mobileFrontend.require('f')
    })
    mw.loader.using('resourceloadermodule', () => {
      var g = M.require('g')
      var h = require('h')
      var i = mw.mobileFrontend.require('i')
    }, () => console.log('banana'))
    `
  }
}

test('tracks usages of require in its various forms in .requires', (t) => {
  t.deepEqual(
    walk(requirev, files.a.source, 'a'),
    fileAnalysis({ async_requires: [], requires: ['a', 'b', 'c'], source: files.a.source })
  )
  t.end()
})

test('doesn\'t allow usage of require in its various forms with non-string literals', (t) => {
  t.throws(() => {
    walk(requirev, files.aa.source, 'aa')
  }, /Require must be used with string literals/)
  t.throws(() => {
    walk(requirev, files.bb.source, 'bb')
  }, /Require must be used with string literals/)
  t.throws(() => {
    walk(requirev, files.cc.source, 'cc')
  }, /Require must be used with string literals/)
  t.end()
})

test('tracks usages of async requires in its various forms in .async_requires', (t) => {
  t.deepEqual(
    walk(requirev, files.d.source, 'd'),
    fileAnalysis({
      async_requires: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
      requires: [],
      source: files.d.source
    })
  )
  t.end()
})
