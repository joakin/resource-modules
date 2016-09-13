// @flow
const path = require('path')

const visitors = require('./lib/visitors')
const {getFiles, getJSON} = require('./lib/fs')
const {analyzeFiles} = require('./lib/analyze')
const lint = require('./lib/lint')

import type {Analysis} from './lib/analyze'

const folder = '/Users/jhernandez/dev/wikimedia/mediawiki-vagrant/mediawiki/extensions/MobileFrontend'

main(folder)

function main (dir) {
  Promise.all([

    // Get frontend assets
    getFiles(path.join(dir, '/resources'))
      // Remove folder prefix and filter only JS files
      .then((files: string[]) =>
        files.map(replace(dir + path.sep, '')).filter(isJSFile))
      // Analyze the JS files
      .then((jsFiles: string[]) => analyzeFiles(dir, jsFiles, visitors)),

    // Get ResourceModules definitions
    getJSON(dir, 'extension.json')
      .then((json) => json.ResourceModules)

  ])
    .then(([ana, resourceModules]: [{ files: Analysis }, Object]) => {
      const errors = lint(ana, resourceModules)

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
      // const prn = require('./lib/prn')
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

      //     return
    })
    .catch((e) => console.error(e))
}

function isJSFile (name) { return name.slice(name.length - 3) === '.js' }

function replace (rpl, s) { return (str) => str.replace(rpl, s) }
