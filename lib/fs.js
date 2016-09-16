// @flow

const fs = require('fs')
const path = require('path')
const readDir = require('recursive-readdir')

module.exports = {
  getFiles,
  getSources,
  getSource,
  getJSON
}

function getFiles (dir: string): Promise<string[]> {
  return new Promise((resolve, reject) =>
    readDir(dir, (err, files) => err ? reject(err) : resolve(files)))
}

type Source = { source: string }
export type Sources = { [key: string]: Source }

function getSources (dir: string, files: string[]): Promise<Sources> {
  let mfiles = {}
  return Promise.all(
    files.map((f) => getSource(dir, f)
      .then((source) => { mfiles[f] = {source} })))
    .then(() => mfiles)
}

function getSource (folder: string, file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(path.join(folder, file))
    fs.readFile(filePath, (err, contents) =>
                err ? reject(err) : resolve(contents.toString()))
  })
}

function getJSON (folder: string, file: string): Promise<Object> {
  return getSource(folder, file)
    .then((contents) => JSON.parse(contents))
}
