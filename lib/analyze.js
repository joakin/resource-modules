// @flow

import type {Node} from 'acorn'
import type {VisitorMap} from 'acorn/dist/walk'
import type {FileAnalysis, State} from './visitors/types'

const {fileAnalysis} = require('./visitors/types')

const acorn = require('acorn')
const walk = require('acorn/dist/walk')

const {getSources} = require('./fs')
import type {Sources} from './fs'

module.exports = {
  analyzeFiles,
  parse,
  walk: walkAst
}

export type Analysis = {
  files: { [file: string]: FileAnalysis }
}

function analyzeFiles (dir: string, jsFiles: string[], visitors: VisitorMap<State>): Promise<Analysis> {
  return getSources(dir, jsFiles)
    .then((files: Sources) => {
      let analysis: Analysis = { files: {} }
      Object.keys(files).forEach((f) => {
        analysis.files[f] = walkAst(visitors, files[f].source, f)
      })
      return analysis
    })
}

function parse (source: string): Node {
  return acorn.parse(source, {locations: true})
}

function walkAst (visitors: VisitorMap<State>, source: string, file: string): FileAnalysis {
  const ast = parse(source)
  const state: State = {
    file,
    data: fileAnalysis({source})
  }
  walk.ancestor(ast, visitors, null, state)
  return state.data
}
