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
      files.map((f) => f.replace(folder, '')).filter(isJSFile))
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
          missingDependencies: []
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
              .some(([f, fa]) => {
                if (
                  (fa.requires && Array.isArray(fa.requires) && fa.requires.indexOf(mfId) > -1) ||
                  (fa.async_requires && Array.isArray(fa.async_requires) && fa.async_requires.indexOf(mfId) > -1)
                )
                  return true
                else
                  return false
              }))
        }

        // { requires: MFmoduleid
        //   defines: MFmoduleid
        //   async_requires: MFmoduleid,
        //   mw_requires: mw.requires
      }

    })

    if (errors.skippedBecauseNotInResourceModules.length > 0) {
      console.log('Warning: Not in extension.json (couldn\'t verify):')
      console.log(errors.skippedBecauseNotInResourceModules.map((f) => '  ' + f).join('\n'))
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

        console.log(`\nError: Missing messages used directly in file: ${k}:`)
        console.log(Object.keys(messagesByModule).map((name) =>
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

        console.log(`\nError: Missing templates used directly in file: ${k}:`)
        console.log(Object.keys(templatesByModule).map((name) =>
          `  In module ${name}, missing:\n` +
          templatesByModule[name].map((template) => '    ' + template.fileName).join('\n')
        ).join('\n'))
      }

      if (f.unusedDefines.length > 0) {
        console.log(`\nError: Unused defines from file: ${k}:`)
        console.log(f.unusedDefines.map((name) =>
          `  ${name}`
        ).join('\n'))
      }
    })

    // Print all analysis
    // prn(ana, true)

    // console.log(Object.keys(ana).length)
    // console.log(Object.keys(resourceModules))
    
    // Unique sorted mw dependencies
    // console.log(
    //   Object.keys(ana.files)
    //     .reduce((a, f) => a.concat(ana.files[f].mw_requires), [])
    //     .filter((v, k, a) => a.indexOf(v) === k)
    //     .sort()
    //     .join('\n'))
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
