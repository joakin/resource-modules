#!/usr/bin/env node

import * as path from 'path'
import {exec} from 'child_process'

import visitors from './visitors'
import {getFiles, getJSON} from './fs'
import {Analysis, analyzeFiles} from './analyze'
import lint from './lint'
import {FileErrors, MissingMessage} from './lint/types'

import {ResourceModules, ExtensionJson} from './types'

const coreResources = '/resources/Resources.php'

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
    analyzeJSFiles(dir, '/resources', true),

    // Get core's frontend assets
    analyzeJSFiles(coreDir, '/resources', false),

    // Get all ResourceModules definitions
    Promise.all([
      getJSON(dir, 'extension.json').then((json) => (<ExtensionJson>json).ResourceModules),
      getPhpConfig(coreDir, coreResources)
    ]).then(([ext, core]: [ResourceModules, ResourceModules]): ResourceModules =>
      <ResourceModules>Object.assign({}, core, ext))

  ] as [Promise<Analysis>, Promise<Analysis>, Promise<ResourceModules>])
    .then(([ana, coreAna, resourceModules]: [Analysis, Analysis, ResourceModules]) => {
      const errors = lint(ana, coreAna, resourceModules)
      let exit = 0

      if (errors.skippedBecauseNotInResourceModules.length > 0) {
        console.error('Warning: Not in extension.json (couldn\'t verify):')
        console.error(errors.skippedBecauseNotInResourceModules.map((f) => '  ' + f).join('\n'))
      }

      type FileAndErrors = [string, FileErrors]
      const filesWithErrors: FileAndErrors[] = Object.keys(errors.files)
        .map((fk: string): FileAndErrors => [fk, errors.files[fk]])
        .filter(([file, fileErrors]: FileAndErrors): boolean => {
          return Object.keys(fileErrors).some((k: string): boolean =>
            Array.isArray(fileErrors[k]) && (fileErrors[k].length > 0))
        })

      if (filesWithErrors.length > 0) exit = 1

      filesWithErrors.forEach(([k, f]) => {
        if (f.missingMessages && f.missingMessages.length > 0) {
          interface MessagesByModule {
            [key: string]: string[]
          }
          const messagesByModule: MessagesByModule = f.missingMessages.reduce((acc: MessagesByModule, {message, modules}: MissingMessage): MessagesByModule => {
            modules.forEach(([name]) => {
              acc[name] = (acc[name] || [])
              acc[name].push(message)
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
          f.missingTemplates.forEach(({kind, template, modules}) => {
            switch (kind) {
              case 'template_not_in_modules':
                console.error(`\nError: Missing template used directly in file: ${k}:`)
                console.error(`  Template: ${template.module} ${template.fileName}`)
                console.error(`    Not found in modules ${modules.join(', ')}`)
                break
              case 'template_not_in_dependencies':
                console.error(`\nError: Template used directly in file: ${k}:`)
                console.error(`  Template not found in dependencies: ${template.module} ${template.fileName}`)
                console.error(`    Not found in dependencies of modules: ${modules.join(', ')}`)
                break
            }
          })
        }

        if (f.unusedDefines && f.unusedDefines.length > 0) {
          console.error(`\nError: Unused defines from file: ${k}:`)
          console.error(f.unusedDefines.map((name) =>
            `  ${name}`
          ).join('\n'))
        }

        if (f.dependencies && f.dependencies.length > 0) {
          console.error(`\nError: Dependency problems in file: ${k}:`)
          f.dependencies.forEach((error) => {
            switch (error.kind) {
              case 'multiple_defines':
                console.error(`  Required ${error.id} defined in multiple files:`)
                console.error(error.where.map(([f]) => `    ${f}`).join('\n'))
                break
              case 'not_defined':
                console.error(`  Required ${error.id} not defined in any source files`)
                break
              case 'file_in_multiple_dependencies':
                console.error(`  Required ${error.id} defined in file ${error.where[0]} found in multiple ResourceModules:`)
                console.error(error.where[1].map((m) => `    ${m}`).join('\n'))
                break
              case 'not_found':
                console.error(`  Required ${error.id} defined in file ${error.where} not found in any ResourceModules`)
                break
            }
          })
        }
      })

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

function isValidJSFile (name: string) {
  return (
    name.slice(name.length - 3) === '.js' &&
    name.indexOf('-skip.js') === -1
  )
}

function replace (rpl: string, s: string) {
  return (str: string): string => str.replace(rpl, s)
}

function getPhpConfig (dir: string, file: string): Promise<ResourceModules> {
  return new Promise((resolve, reject) => {
    exec(`php ${path.join(__dirname, '..', 'resources.php')} ${dir} ${file}`, (error, stdout, stderr) => {
      if (error) return reject(error)
      console.error(stderr)
      resolve(stdout)
    })
  }).then((t) => (<ResourceModules>JSON.parse(t.toString())))
}
