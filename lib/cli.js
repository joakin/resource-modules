#!/usr/bin/env node
// @flow

const path = require('path')
const exec = require('child_process').exec

const visitors = require('./visitors')
const {getFiles, getJSON} = require('./fs')
const {analyzeFiles} = require('./analyze')
const lint = require('./lint')

import type {Analysis} from './analyze'

const coreResources = '/resources/Resources.php'

if (process.argv.length === 3) {
  const extensionPath = path.resolve(process.argv[2])
  const corePath = path.resolve(path.join(extensionPath, '../..'))
  main(corePath, extensionPath)
} else {
  console.log('I need a parameter with the path to the extension')
  process.exit(1)
}

function main (coreDir, dir) {
  Promise.all([

    // Get frontend assets
    analyzeJSFiles(dir, '/resources', true),

    // Get core's frontend assets
    analyzeJSFiles(coreDir, '/resources', false),

    // Get all ResourceModules definitions
    Promise.all([
      getJSON(dir, 'extension.json').then((json) => json.ResourceModules),
      getPhpConfig(coreDir, coreResources)
    ]).then(([ext, core]) => Object.assign({}, core, ext))

  ])
    .then(([ana, coreAna, resourceModules]: [Analysis, Analysis, Object]) => {
      const errors = lint(ana, coreAna, resourceModules)

      if (errors.skippedBecauseNotInResourceModules.length > 0) {
        console.error('Warning: Not in extension.json (couldn\'t verify):')
        console.error(errors.skippedBecauseNotInResourceModules.map((f) => '  ' + f).join('\n'))
      }

      const filesWithErrors = Object.keys(errors.files)
        .map((fk) => [fk, errors.files[fk]])
        .filter(([file, fileErrors]) => {
          return Object.keys(fileErrors).some((k) => Array.isArray(fileErrors[k]) && (fileErrors[k].length > 0))
        })

      filesWithErrors.forEach(([k, f]) => {
        // Print analysis data
        // console.log('\n%s\n%s', k, JSON.stringify(Object.assign(ana.files[k], {source: ''})))

        if (f.missingMessages && f.missingMessages.length > 0) {
          const messagesByModule = f.missingMessages.reduce((acc, [msg, modules]) => {
            modules.forEach(([name]) => {
              acc[name] = (acc[name] || [])
              acc[name].push(msg)
            })
            return acc
          }, {})

          console.error(`\nError: Missing messages used directly in file: ${k}:`)
          console.error(Object.keys(messagesByModule).map((name) =>
            `  In module ${name}, missing:\n` +
            messagesByModule[name].map((msg) => '    ' + msg).join('\n')
          ).join('\n'))
        }

        if (f.missingTemplates && f.missingTemplates.length > 0) {
          const templatesByModule = f.missingTemplates.reduce((acc, [template, modules]) => {
            modules.forEach(([name]) => {
              acc[name] = (acc[name] || [])
              acc[name].push(template)
            })
            return acc
          }, {})

          console.error(`\nError: Missing templates used directly in file: ${k}:`)
          console.error(Object.keys(templatesByModule).map((name) =>
            `  In module ${name}, missing:\n` +
            templatesByModule[name].map((template) => '    ' + template.fileName).join('\n')
          ).join('\n'))
        }

        if (f.unusedDefines && f.unusedDefines.length > 0) {
          console.error(`\nError: Unused defines from file: ${k}:`)
          console.error(f.unusedDefines.map((name) =>
            `  ${name}`
          ).join('\n'))
        }

        if (f.dependencies && f.dependencies.length > 0) {
          console.error(`\nError: Dependency problems in file: ${k}:`)
          f.dependencies.forEach(({kind, id, where}) => {
            switch (kind) {
              case 'multiple_defines':
                console.error(`  Required ${id} defined in multiple files:`)
                console.error(where.map(([f]) => `    ${f}`).join('\n'))
                break
              case 'not_defined':
                console.error(`  Required ${id} not defined in any source files`)
                break
              case 'file_in_multiple_dependencies':
                console.error(`  Required ${id} defined in file ${where[0]} found in multiple ResourceModules:`)
                console.error(where[1].map((m) => `    ${m}`).join('\n'))
                break
              case 'not_found':
                console.error(`  Required ${id} defined in file ${where} not found in any ResourceModules`)
                break
            }
          })
        }
      })

      // Print all analysis
      // const prn = require('./prn')
      // prn(ana, true)

      // console.error(Object.keys(ana.files))
      // console.error(Object.keys(resourceModules))

      // Unique sorted mw dependencies
      // console.error(
      //   Object.keys(ana.files)
      //     .reduce((a, f) => a.concat(ana.files[f].mw_requires), [])
      //     .filter((v, k, a) => a.indexOf(v) === k)
      //     .sort()
      //     .join('\n'))

      // Unique sorted mw defines
      // console.error(
      //   Object.keys(ana.files)
      //     .map((f) => [f, ana.files[f].mw_defines].toString())
      //     .join('\n'))

      // console.error(
      //   JSON.stringify(
      //     Object.keys(coreAna.files)
      //     .map((f) => [f, coreAna.files[f].mw_defines])
      //     .filter(([f, defs]) => defs.some((d) => d.name === 'mw.util'))
      //   , null, 2)
      // )

      //     return
    })
    .catch((e) => console.error(e))
}

function analyzeJSFiles (dir: string, resources: string, printAnalysisErrors: boolean): Promise<Analysis> {
  return getFiles(path.join(dir, resources))
    // Remove folder prefix and filter only JS files
    .then((files: string[]) =>
      files.map(replace(dir + path.sep, '')).filter(isValidJSFile))
    // Analyze the JS files
    .then((jsFiles: string[]) => analyzeFiles(dir, jsFiles, visitors, printAnalysisErrors))
}

function isValidJSFile (name) {
  return (
    name.slice(name.length - 3) === '.js' &&
    name.indexOf('-skip.js') === -1
  )
}

function replace (rpl, s) { return (str) => str.replace(rpl, s) }

function getPhpConfig (dir: string, file: string): Promise<Object> {
  return new Promise((resolve, reject) => {
    exec(`php ${path.join(__dirname, '..', 'resources.php')} ${dir} ${file}`, (error, stdout, stderr) => {
      if (error) return reject(error)
      console.error(stderr)
      resolve(stdout)
    })
  }).then((t) => JSON.parse(t.toString()))
}
