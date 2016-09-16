// @flow

const test = require('tape')

const prn = require('../lib/prn')

test('returns an nested colored string representation of an object by default', (t) => {
  t.equal(
    prn({a: 1, b: 2, c: {a: 1, b: {c: 3}}}),
    '{ a: \x1b[33m1\x1b[39m, b: \x1b[33m2\x1b[39m, c: { a: \x1b[33m1\x1b[39m, b: { c: \x1b[33m3\x1b[39m } } }'
  )
  t.end()
})

test('returns nothing when passed out=true', (t) => {
  t.equal(
    prn({a: 1, b: 2, c: {a: 1, b: {c: 3}}}, true),
    void 0
  )
  t.end()
})
