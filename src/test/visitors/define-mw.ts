import test = require('tape')

import {walk} from '../../analyze'
import defineMw from '../../visitors/define-mw'
import {fileAnalysis} from '../../visitors/types'

const files = {
  a: {
    source: `
    mw.banana = {}
    `
  },
  b: {
    source: `
    mw.banana = {
      phone: 1,
      ring: function () {}
    }
    `
  },
  c: {
    source: `
    mw.banana = {}
    mw.banana.phone = 1
    mw.banana.ring = function () {}
    `
  },
  d: {
    source: `
    mw.banana.phone = 1
    mw.banana.ring = function () {}
    `
  },
  e: {
    source: `
    this.banana = 1
    a.b = 2
    `
  },
  f: {
    source: `
    mw = {
      a: 1
    }
    `
  },
  g: {
    source: `
    mw = {
      a: null
    }
    `
  }
}

test('tracks definition of mw.<...> namespaces', (t) => {
  t.deepEqual(
    walk(defineMw, files.a.source, 'a'),
    fileAnalysis({
      mw_defines: [{
        type: 'namespace',
        name: 'mw.banana',
        definitions: []
      }],
      source: files.a.source
    })
  )
  t.end()
})

test('tracks definitions in mw.<...> namespace object', (t) => {
  t.deepEqual(
    walk(defineMw, files.b.source, 'b'),
    fileAnalysis({
      mw_defines: [{
        type: 'namespace',
        name: 'mw.banana',
        definitions: ['phone', 'ring']
      }],
      source: files.b.source
    })
  )
  t.end()
})

test('tracks standalone definitions mw.<...>.<...>', (t) => {
  t.deepEqual(
    walk(defineMw, files.c.source, 'c'),
    fileAnalysis({
      mw_defines: [{
        type: 'namespace',
        name: 'mw.banana',
        definitions: ['phone', 'ring']
      }],
      source: files.c.source
    })
  )
  t.end()
})

test('tracks usage of mw.<...> as assignments if namespace not defined in file', (t) => {
  t.deepEqual(
    walk(defineMw, files.d.source, 'd'),
    fileAnalysis({
      mw_defines: [{
        type: 'assignment',
        name: 'mw.banana.phone'
      }, {
        type: 'assignment',
        name: 'mw.banana.ring'
      }],
      source: files.d.source
    })
  )
  t.end()
})

test('doesn\'nt track definition of other variables', (t) => {
  t.deepEqual(
    walk(defineMw, files.e.source, 'e'),
    fileAnalysis({
      mw_defines: [],
      source: files.e.source
    })
  )
  t.end()
})

test('tracks definition of mw namespace', (t) => {
  t.deepEqual(
    walk(defineMw, files.f.source, 'f'),
    fileAnalysis({
      mw_defines: [{
        type: 'namespace',
        name: 'mw',
        definitions: ['a']
      }],
      source: files.f.source
    })
  )
  t.end()
})

test('doesnt track definition of null properties', (t) => {
  t.deepEqual(
    walk(defineMw, files.g.source, 'g'),
    fileAnalysis({
      mw_defines: [{
        type: 'namespace',
        name: 'mw',
        definitions: []
      }],
      source: files.g.source
    })
  )
  t.end()
})
