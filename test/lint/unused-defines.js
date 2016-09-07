const test = require('tape')

const getUnusedDefinesErrors = require('../../lib/lint/unused-defines')

test('won\'t return errors if there are not defines', (t) => {
  t.equal(getUnusedDefinesErrors({}), undefined)
  t.equal(getUnusedDefinesErrors({defines: []}), undefined)
  t.end()
})

test('it should not complain if defined in source are used in some other files', (t) => {
  t.deepEqual(getUnusedDefinesErrors({
    defines: ['mobile.browser/Browser']
  }, null, {
    files: { f1: { requires: ['mobile.browser/Browser'] } }
  }), [])

  t.deepEqual(getUnusedDefinesErrors({
    defines: ['mobile.browser/Browser']
  }, null, {
    files: { f1: { async_requires: ['mobile.browser/Browser'] } }
  }), [])

  t.end()
})

test('it should complain if defined in source are not used in other files', (t) => {
  t.deepEqual(getUnusedDefinesErrors({
    defines: ['mobile.browser/Browser']
  }, null, {
    files: {
      f1: { requires: ['mobile.browser'] },
      f2: { requires: ['Browser'] },
      f3: { async_requires: ['Browser'] }
    }
  }), ['mobile.browser/Browser'])

  t.end()
})
