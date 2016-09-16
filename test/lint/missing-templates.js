// @flow

const test = require('tape')

const {fileAnalysis} = require('../../lib/visitors/types')
const getMissingTemplatesErrors = require('../../lib/lint/missing-templates')

test('won\'t return errors if there are not templates', (t) => {
  t.deepEqual(getMissingTemplatesErrors(fileAnalysis({}), []), [])
  t.deepEqual(getMissingTemplatesErrors(fileAnalysis({templates: []}), []), [])
  t.end()
})

test('it should not complain if templates used in source are in the resource modules', (t) => {
  t.deepEqual(getMissingTemplatesErrors(fileAnalysis({
    templates: [{ module: 'module1', fileName: 'Drawer.hogan' }]
  }), [
    ['module1', { templates: {'Drawer.hogan': './banana/phone.hogan'} }]
  ]), [])
  t.end()
})

test('it should list templates used in source that are not in the resource modules', (t) => {
  const s1 = { module: 'module1', fileName: 'Drawer.hogan' }
  const s2 = { module: 'module1', fileName: 'Banana.hogan' }
  const s3 = { module: 'module1', fileName: 'Phone.hogan' }
  const m1 = ['module1', { templates: {'Drawer.hogan': './banana/phone.hogan'} }]
  t.deepEqual(getMissingTemplatesErrors(fileAnalysis({
    templates: [s1, s2, s3]
  }), [m1]), [
    [s2, [m1]],
    [s3, [m1]]
  ])
  t.end()
})
