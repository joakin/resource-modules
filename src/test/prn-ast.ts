import test = require('tape')

import prn from '../prn-ast'
import {parse} from '../analyze'

test('returns the ast as text with line and number', (t) => {
  t.equal(
    prn(parse('var a = 1;\n1 + 1').ast),
    'Line 1 Column 0\n\nvar a = 1;\n1 + 1;\n'
  )
  t.end()
})

test('when passing justCode=true returns just the source', (t) => {
  t.equal(
    prn(parse('var a = 1;\n1 + 1').ast, true),
    'var a = 1;\n1 + 1;'
  )
  t.end()
})
