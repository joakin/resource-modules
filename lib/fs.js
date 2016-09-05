const fs = require('fs')
const path = require('path')
const readDir = require('recursive-readdir')

module.exports = {
  getFiles,
  getSources,
  getSource,
  getJSON
}

// String -> Promise (List String)
function getFiles (dir) {
  return new Promise((resolve, reject) =>
    readDir(dir, (err, files) => err ? reject(err) : resolve(files)))
}

// String -> List String -> Promise (Map String {source: String})
function getSources (dir, files) {
  let mfiles = {}
  return Promise.all(
    files.map((f) => getSource(dir, f)
      .then((source) => { mfiles[f] = {source} })))
    .then(() => mfiles)
}

// String -> String -> Promise String
function getSource (folder, file) {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(path.join(folder, file))
    fs.readFile(filePath, (err, contents) =>
                err ? reject(err) : resolve(contents.toString()))
  })
}

// String -> String -> Promise JSON
function getJSON (folder, file) {
  return getSource(folder, 'extension.json')
    .then((contents) => JSON.parse(contents))
}
