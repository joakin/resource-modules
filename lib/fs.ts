import * as fs from 'fs'
import * as path from 'path'
import readDir = require('recursive-readdir')

export function getFiles (dir: string): Promise<string[]> {
  return new Promise((resolve, reject) =>
    readDir(dir, (err, files) => err ? reject(err) : resolve(files)))
}

interface Source { source: string }
export interface Sources { [key: string]: Source }

export function getSources (dir: string, files: string[]): Promise<Sources> {
  let mfiles: Sources = {}
  return Promise.all(
    files.map((f) => getSource(dir, f)
      .then((source: string): void => { mfiles[f] = {source} })))
    .then(() => mfiles)
}

export function getSource (folder: string, file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(path.join(folder, file))
    fs.readFile(filePath, (err, contents) =>
                err ? reject(err) : resolve(contents.toString()))
  })
}

export function getJSON (folder: string, file: string): Promise<Object> {
  return getSource(folder, file)
    .then((contents) => JSON.parse(contents))
}
