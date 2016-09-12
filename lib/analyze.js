// @flow

const acorn = require('acorn')
const walk = require('acorn/dist/walk')

const {getSources} = require('./fs')
import type {Sources} from './fs'

module.exports = {
  analyzeFiles,
  parse,
  walk: walkAst
}

type Visitor = (node: Object, state: {data: Object}, ancestors: Object[]) => void
type VisitorsMap = {[key: string]: Visitor}

function analyzeFiles (dir: string, jsFiles: string[], visitors: VisitorsMap): Sources {
  return getSources(dir, jsFiles)
    .then((files) => {
      Object.keys(files).forEach((f) =>
        walkAst(visitors, files, f))
      return { files }
    })
}

function parse (source: string): Object {
  return acorn.parse(source, {locations: true})
}

function walkAst (visitors: VisitorsMap, files: Sources, file: string): Sources {
  const ast = parse(files[file].source)
  walk.ancestor(ast, visitors, null, {file, data: files[file]})
  return files
}
