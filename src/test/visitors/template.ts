import test = require('tape')

import {walk} from '../../analyze'
import template from '../../visitors/template'
import {fileAnalysis} from '../../visitors/types'

const files = {
  'a': {
    source: `mw.template.get( 'mobile.overlays', 'header.hogan' )`
  },
  'b': {
    source: `
    var a = mw.template.get( 'mobile.overlays', 'header.hogan' )
    var b = mw.template.get( 'mobile.whatever', 'banana.hogan' )
    `
  },
  'c': {
    source: `
    var a = mw.template.get( banana, 'header.hogan' )
    `
  },
  'd': {
    source: `
    var b = mw.template.get( 'mobile.whatever', phone )
    `
  }
}

test('tracks mw.template.get\'s RLmodule and template name in .templates', (t) => {
  t.deepEqual(
    walk(template, files.a.source, 'a'),
    fileAnalysis({
      templates: [{module: 'mobile.overlays', fileName: 'header.hogan'}],
      source: files.a.source
    })
  )
  t.end()
})

test('tracks multiple mw.template.get\'s', (t) => {
  t.deepEqual(
    walk(template, files.b.source, 'b'),
    fileAnalysis({
      templates: [
        {module: 'mobile.overlays', fileName: 'header.hogan'},
        {module: 'mobile.whatever', fileName: 'banana.hogan'}
      ],
      source: files.b.source
    })
  )
  t.end()
})

test('Warns against using mw.template.get with non string literals', (t) => {
  t.throws(() => {
    walk(template, files.c.source, 'c')
  }, /mw.template.get must be used with string literals/)
  t.throws(() => {
    walk(template, files.d.source, 'd')
  }, /mw.template.get must be used with string literals/)
  t.end()
})
