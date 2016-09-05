const fs = require('fs')
const path = require('path')
const readDir = require('recursive-readdir')

module.exports = {
  getFiles,
  getSource,
  getJSON
}

function getFiles (dir) {
  return new Promise((resolve, reject) =>
    readDir(dir, (err, files) => err ? reject(err) : resolve(files)))
}

function getSource (folder, file) {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(path.join(folder, file))
    fs.readFile(filePath, (err, contents) =>
                err ? reject(err) : resolve(contents))
  })
}

function getJSON (folder, file) {
  return getSource(folder, 'extension.json')
    .then((contents) => JSON.parse(contents))
}
