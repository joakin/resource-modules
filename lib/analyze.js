// @flow

import type {Node} from 'acorn'
import type {VisitorMap} from 'acorn/dist/walk'

const acorn = require('acorn')
const walk = require('acorn/dist/walk')

const {getSources} = require('./fs')
import type {Sources} from './fs'

module.exports = {
  analyzeFiles,
  parse,
  walk: walkAst
}

function analyzeFiles (dir: string, jsFiles: string[], visitors: VisitorMap): Sources {
  return getSources(dir, jsFiles)
    .then((files) => {
      Object.keys(files).forEach((f) =>
        walkAst(visitors, files, f))
      return { files }
    })
}

function parse (source: string): Node {
  return acorn.parse(source, {locations: true})
}

function walkAst (visitors: VisitorMap, files: Sources, file: string): Sources {
  const ast = parse(files[file].source)
  walk.ancestor(ast, visitors, null, {file, data: files[file]})
  return files
}
