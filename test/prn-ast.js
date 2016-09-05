const test = require('tape')

const prn = require('../lib/prn-ast')
const {parse} = require('../lib/analyze')

test('returns the ast as text with line and number', (t) => {
  t.equal(
    prn(parse('var a = 1;\n1 + 1')),
    'Line 1 Column 0\n\nvar a = 1;\n1 + 1;\n'
  )
  t.end()
})

test('when passing justCode=true returns just the source', (t) => {
  t.equal(
    prn(parse('var a = 1;\n1 + 1'), true),
    'var a = 1;\n1 + 1;'
  )
  t.end()
})
