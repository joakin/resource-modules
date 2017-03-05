#!/usr/bin/env node

import * as path from 'path'
import {exec} from 'child_process'

import visitors from './visitors'
import {getFiles, getJSON} from './fs'
import {Analysis, analyzeFiles} from './analyze'
import lint from './lint'
import logErrors from './errors'

import {ResourceModules, ExtensionJson} from './types'

const RESOURCES = '/resources'
const frontendAssets = RESOURCES
const coreResources = `${RESOURCES}/Resources.php`

if (process.argv.length === 3) {
  const extensionPath = path.resolve(process.argv[2])
  const corePath = path.resolve(path.join(extensionPath, '../..'))
  main(corePath, extensionPath)
} else {
  console.log('I need a parameter with the path to the extension')
  process.exit(1)
}

function main (coreDir: string, dir: string): void {
  Promise.all([

    // Get frontend assets
    analyzeJSFiles(dir, frontendAssets, true),

    // Get core's frontend assets
    analyzeJSFiles(coreDir, frontendAssets, false),

    // Get all ResourceModules definitions
    Promise.all([
      getJSON(dir, 'extension.json').then((json) => (<ExtensionJson>json).ResourceModules),
      getPhpConfig(coreDir, coreResources)
    ]).then(([ext, core]: [ResourceModules, ResourceModules]): ResourceModules =>
      <ResourceModules>Object.assign({}, core, ext))

  ] as [Promise<Analysis>, Promise<Analysis>, Promise<ResourceModules>])
    .then(([ana, coreAna, resourceModules]: [Analysis, Analysis, ResourceModules]) => {

      const errors = lint(ana, coreAna, resourceModules)
      const exit = logErrors(errors)
      process.exit(exit)

    })
    .catch((e: Error) => {
      console.error(e)
      process.exit(1)
    })
}

function analyzeJSFiles (
  dir: string, resources: string, printAnalysisErrors: boolean
): Promise<Analysis> {
  return getFiles(path.join(dir, resources))
    // Remove folder prefix and filter only JS files
    .then((files: string[]): string[] =>
      files.map(replace(dir + path.sep, '')).filter(isValidJSFile))
    // Analyze the JS files
    .then((jsFiles: string[]): Promise<Analysis> =>
      analyzeFiles(dir, jsFiles, visitors, printAnalysisErrors))
}

const ignoreFiles = [
  /qunit/
]

function isValidJSFile (name: string) {
  return (
    name.slice(name.length - 3) === '.js' &&
    name.indexOf('-skip.js') === -1 &&
    !ignoreFiles.some((r) => r.test(name))
  )
}

function replace (rpl: string, s: string) {
  return (str: string): string => str.replace(rpl, s)
}

function getPhpConfig (dir: string, file: string): Promise<ResourceModules> {
  return new Promise((resolve, reject) => {
    exec(`php ${path.join(__dirname, '..', 'src/php/resources.php')} ${dir} ${file}`, (error, stdout, stderr) => {
      if (error) return reject(error)
      console.error(stderr)
      resolve(stdout)
    })
  }).then((t) => (<ResourceModules>JSON.parse(t.toString())))
}
