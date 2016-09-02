const fs = require('fs')
const path = require('path')

const acorn = require('acorn')
const walk = require('acorn/dist/walk')

const readDir = require('recursive-readdir')

const matchers = require('./lib/matchers')
const prn = require('./lib/prn')

const folder = '/Users/jhernandez/dev/wikimedia/mediawiki-vagrant/mediawiki/extensions/MobileFrontend'

const testFiles = [
  'resources/mobile.mainMenu/MainMenu.js',
  'resources/mobile.backtotop/backtotop.js',
  'resources/mobile.backtotop/BackToTopOverlay.js',
  'resources/mobile.browser/browser.js',
  'resources/mobile.abusefilter/AbuseFilterOverlay.js',
  'resources/mobile.abusefilter/AbuseFilterPanel.js'
]


Promise.all([
  getFiles(path.join(folder, '/resources'))
    .then((files) =>
      files.map((f) => f.replace(folder + path.sep, '')).filter(isJSFile))
    .then(getAnalysisFromJSFiles),
  getResourceModulesInfo(folder)
])
  .then(([ana, resourceModules]) => {

    // Match ana info with extension.json info
    let errors = {
      skippedBecauseNotInResourceModules: [],
      files: {}
    }
    Object.keys(ana.files).forEach((file) => {
      const inModules = getResourceModulesWithFile(file, resourceModules)

      if (inModules.length < 1) {
        errors.skippedBecauseNotInResourceModules.push(file)
      } else {
        // Check that analysis data is included in resourceModules
        const a = ana.files[file]
        errors.files[file] = {
          missingMessages: [],
          missingTemplates: [],
          unusedDefines: [],
          dependencies: []
        }

        // Messages
        if (a.messages && a.messages.length > 0) {
          errors.files[file].missingMessages = a.messages.reduce((errs, msg) => {
            // Modules with missing messages
            const missing = inModules.filter(([name, module]) => {
              if (!module.messages) return true
              if (Array.isArray(module.messages))
                return module.messages.indexOf(msg) === -1
              if (module.messages.constructor === Object)
                return !Object.keys(module.messages)
                  .some((weirdKey) => module.messages[weirdKey] === msg)
            })
            if (missing.length > 0) errs.push([msg, missing])
            return errs
          }, [])
        }

        // Templates
        if (a.templates && a.templates.length > 0) {
          // templates: [ { module: RLmodule, fileName: 'Drawer.hogan' } ],
          errors.files[file].missingTemplates = a.templates.reduce((errs, template) => {
            // Modules with missing templates
            const missing = inModules.filter(([name, module]) => {
              if (!module.templates) return true
              if (module.templates.constructor === Object)
                return !Object.keys(module.templates)
                  .some((tplName) => tplName === template.fileName &&
                        template.module === module.templates[tplName])
              throw new Error (`In module ${name}, templates is not an object`)
            })
            if (missing.length > 0) errs.push([template, missing])
            return errs
          }, [])
        }

        // Unused defines
        if (a.defines && a.defines.length) {
          errors.files[file].unusedDefines = a.defines.filter((mfId) =>
            // If mfId is not required somewhere with with M.require
            !Object.keys(ana.files).map((f) => [f, ana.files[f]])
              .some(([f, fa]) =>
                (fa.requires && Array.isArray(fa.requires) && fa.requires.indexOf(mfId) > -1) ||
                (fa.async_requires && Array.isArray(fa.async_requires) && fa.async_requires.indexOf(mfId) > -1)
              ))
        }


        // Required dependencies in source that are missing in ResourceModules
        // or not defined in the source (M.define)
        // (Using M.require)
        if (a.requires && a.requires.length) {
          errors.files[file].dependencies = a.requires.reduce((errs, mfId) => {
            // Find out which file defines mfId (if any)
            const whoDefines = Object.keys(ana.files).map((f) => [f, ana.files[f]])
              .filter(([f, fa]) =>
                fa.defines && Array.isArray(fa.defines) &&
                fa.defines.indexOf(mfId) > -1)

            if (whoDefines.length > 1) {
              errs.push({kind: 'multiple_defines', id: mfId, where: whoDefines})
            } else if (whoDefines.length === 0) {
              errs.push({kind: 'not_defined', id: mfId, where: whoDefines})
            } else {
              const [definer] = whoDefines[0]

              const getDependenciesWithFile = (scriptToFind, moduleName, module, source) => {
                if (!module) return []

                let found = []
                if (module.scripts && module.scripts.indexOf(scriptToFind) > -1) {
                  found.push(moduleName)
                }

                if (module.dependencies) {
                  module.dependencies.forEach((dep) => {
                    found = found.concat(getDependenciesWithFile(scriptToFind, dep, resourceModules[dep], source))
                  })
                }
                return found
              }

              // Traverse dependencies of the RLModules where source file is used
              // and check file that defines is there somewhere
              inModules.forEach(([name, module]) => {
                // Script defined before me, or check my dependencies for it
                const inDependencies = getDependenciesWithFile(definer, name, module, file)
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                if (inDependencies.length > 1) {
                  errs.push({kind: 'file_in_multiple_dependencies', id: mfId, where: [definer, inDependencies]})
                } else if (inDependencies.length === 0) {
                  errs.push({kind: 'not_found', id: mfId, where: definer})
                }
              })

            }

            return errs
          }, [])
        }

        // Check required async dependencies that the module name in
        // mw.loader.using is correct


        // { requires: MFmoduleid
        //   defines: MFmoduleid
        //   async_requires: MFmoduleid,
        //   mw_requires: mw.requires
      }

    })

    if (errors.skippedBecauseNotInResourceModules.length > 0) {
      console.error('Warning: Not in extension.json (couldn\'t verify):')
      console.error(errors.skippedBecauseNotInResourceModules.map((f) => '  ' + f).join('\n'))
    }

    const filesWithErrors = Object.keys(errors.files)
      .map((fk) => [fk, errors.files[fk]])
      .filter(([file, fileErrors]) => {
        return Object.keys(fileErrors).some((k) => fileErrors[k].length > 0)
      })
    filesWithErrors.forEach(([k, f]) => {
      if (f.missingMessages.length > 0) {
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

      if (f.missingTemplates.length > 0) {
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

      if (f.unusedDefines.length > 0) {
        console.error(`\nError: Unused defines from file: ${k}:`)
        console.error(f.unusedDefines.map((name) =>
          `  ${name}`
        ).join('\n'))
      }

      if (f.dependencies.length > 0) {
        console.error(`\nError: Dependency problems in file: ${k}:`)
        f.dependencies.forEach(({kind, id, where}) => {
          switch(kind) {
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

function getResourceModulesWithFile (file, resourceModules) {
  return Object.keys(resourceModules)
    .filter((rk) => (resourceModules[rk].scripts || []).indexOf(file.replace(/^\//, '')) > -1)
    .map((rk) => [rk, resourceModules[rk]])
}

function getResourceModulesInfo (folder) {
  return getSource(folder, 'extension.json')
    .then((contents) => JSON.parse(contents).ResourceModules)
}

function getAnalysisFromJSFiles (jsFiles) {
  let state = {
    files: {}
  }
  return Promise.all(
    jsFiles.map((f) =>
      getSource(folder, f)
        .then((source) => processFile(state, f, source)))
  ).then(() => state)
}

function getFiles (dir) {
  return new Promise((res, rej) =>
    readDir(dir, (err, files) => err ? rej(err) : res(files)))
}

function getSource (folder, file) {
  return new Promise((resolve, reject) => {
  const filePath = path.resolve(path.join(folder, file))
  fs.readFile(filePath, (err, contents) =>
              err ? reject(err) : resolve(contents))
  })
}

function processFile (state, filePath, source) {
  walkAst(state, filePath, parseFile(source))
}

function parseFile (source) {
  return acorn.parse(source, {locations: true})
}

function walkAst (state, file, ast) {
  const data = state.files[file] = {}
  walk.ancestor(ast, matchers(data, file))
  return state
}

function isJSFile (name) { return name.slice(name.length - 3) === '.js' }
