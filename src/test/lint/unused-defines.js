// @flow

const test = require('tape')

const {fileAnalysis} = require('../../lib/visitors/types')
const getUnusedDefinesErrors = require('../../lib/lint/unused-defines')

test('won\'t return errors if there are not defines', (t) => {
  t.deepEqual(getUnusedDefinesErrors(fileAnalysis({}), [], {files: {}}), [])
  t.deepEqual(getUnusedDefinesErrors(fileAnalysis({defines: []}), [], {files: {}}), [])
  t.end()
})

test('it should not complain if defined in source are used in some other files', (t) => {
  t.deepEqual(getUnusedDefinesErrors(fileAnalysis({
    defines: ['mobile.browser/Browser']
  }), [], {
    files: { f1: fileAnalysis({ requires: ['mobile.browser/Browser'] }) }
  }), [])

  t.deepEqual(getUnusedDefinesErrors(fileAnalysis({
    defines: ['mobile.browser/Browser']
  }), [], {
    files: { f1: fileAnalysis({ async_requires: ['mobile.browser/Browser'] }) }
  }), [])

  t.end()
})

test('it should complain if defined in source are not used in other files', (t) => {
  t.deepEqual(getUnusedDefinesErrors(fileAnalysis({
    defines: ['mobile.browser/Browser']
  }), [], {
    files: {
      f1: fileAnalysis({ requires: ['mobile.browser'] }),
      f2: fileAnalysis({ requires: ['Browser'] }),
      f3: fileAnalysis({ async_requires: ['Browser'] })
    }
  }), ['mobile.browser/Browser'])

  t.end()
})
