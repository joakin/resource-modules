import test = require('tape')

import {walk} from '../../analyze'
import requireMw from '../../visitors/require-mw'
import {fileAnalysis} from '../../visitors/types'

const files = {
  'a': {
    source: `
    mw.apple = 1
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
