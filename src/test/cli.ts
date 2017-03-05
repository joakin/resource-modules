import test = require('tape')
import * as path from 'path'
import * as fs from 'fs'
import {exec} from 'child_process'

const testExtensionFolder = 'dist/test/fixtures/TestMediawiki/extensions/TestExtension/'

test('@integration runs cli on test extension without problems', (t) => {

  const packageJSON = require('../../package.json')
  const binPath = packageJSON.bin['resource-modules']
  const cliFile = path.join(__dirname, '../..', binPath)
  const testExtension = path.join(__dirname, '../..', testExtensionFolder)
  const snapshotStdout = fs.readFileSync(path.join(testExtension, 'test.snapshot')).toString()
  const snapshotStderr = fs.readFileSync(path.join(testExtension, 'test-err.snapshot')).toString()

  exec(`node ${cliFile} ${testExtension}`, (error, stdout, stderr) => {
    if (error) return t.fail(error, 'Error running exec')
    if (stderr) t.equal(stderr, snapshotStderr, 'Expected standard error out')
    t.equal(stdout, snapshotStdout, 'Expected standard out')
    t.end()
  })
})
