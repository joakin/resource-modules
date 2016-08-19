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
  // 'resources/mobile.backtotop/backtotop.js',
  // 'resources/mobile.backtotop/BackToTopOverlay.js',
  // 'resources/mobile.browser/browser.js',
  // 'resources/mobile.abusefilter/AbuseFilterOverlay.js',
  // 'resources/mobile.abusefilter/AbuseFilterPanel.js'
]

let files = null
let state = {
  files: {}
}

getFiles(folder + '/resources')
  .then((fs) => {
    files = fs.map((f) => f.replace(folder, ''))
    return files.filter((f) => f.slice(f.length-3) === '.js')
  })
// Promise.resolve(testFiles)
  .then((jsFiles) =>
    Promise.all(
      jsFiles.map((f) =>
        getSource(folder, f)
          .then((source) => processFile(state, f, source)))))
  .then(() => {
    // Print all state
    prn(state, true)
    
    // Unique sorted mw dependencies
    // console.log(
    //   Object.keys(state.files)
    //     .reduce((a, f) => a.concat(state.files[f].mw_requires), [])
    //     .filter((v, k, a) => a.indexOf(v) === k)
    //     .sort()
    //     .join('\n'))
  })
  .catch((e) => console.error(e))

function getFiles (path) {
  return new Promise((res, rej) =>
    readDir(path, (err, files) => err ? rej(err) : res(files)))
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
