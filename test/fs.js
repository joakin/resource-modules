const test = require('tape')
const path = require('path')

const {getFiles, getSources, getSource, getJSON} = require('../lib/fs')

const testFile = {
  path: path.join('fixtures', 'test.json'),
  source: '{\n  "a": 1\n}\n',
  json: { a: 1 }
}

test('getFiles should return the files in a folder', (t) => {
  t.plan(1)
  getFiles(path.join(__dirname, 'fixtures'))
    .then((fs) =>
          t.deepEqual(fs, [path.join(__dirname, testFile.path)]))
})

test('getSources should return a map with files as keys, and sources in the value', (t) => {
  t.plan(1)
  getSources(__dirname, [testFile.path])
    .then((fs) =>
          t.deepEqual(fs, {
            [testFile.path]: { source: testFile.source }
          }))
})

test('getSources should return a map with files as keys, and sources in the value', (t) => {
  t.plan(1)
  getSource(__dirname, testFile.path)
    .then((fs) => t.deepEqual(fs, testFile.source))
})

test('getJSON should return a js object parsed from the source of the file', (t) => {
  t.plan(1)
  getJSON(__dirname, testFile.path)
    .then((fs) => t.deepEqual(fs, testFile.json))
})
