import {Node} from 'acorn'
import * as acorn from 'acorn'
import * as acornWalk from 'acorn/dist/walk'
import {VisitorMap} from 'acorn/dist/walk'
import {fileAnalysis, FileAnalysis, State} from './visitors/types'

import {getSources, Sources} from './fs'

export interface Analysis {
  files: { [file: string]: FileAnalysis }
}

export function analyzeFiles (
  dir: string, jsFiles: string[], visitors: VisitorMap<State>, noisy: boolean
): Promise<Analysis> {
  return getSources(dir, jsFiles)
    .then((files: Sources) => {
      let analysis: Analysis = { files: {} }
      Object.keys(files).forEach((f) => {
        analysis.files[f] = walk(visitors, files[f].source, f, noisy)
      })
      return analysis
    })
}

export function parse (source: string): Node {
  return acorn.parse(source, {locations: true})
}

export function walk (
  visitors: VisitorMap<State>, source: string, file: string, noisy: boolean = false
): FileAnalysis {
  try {
    const ast = parse(source)
    const state: State = {
      file,
      data: fileAnalysis({source}),
      analysisErrors: []
    }
    acornWalk.ancestor(ast, visitors, null, state)
    if (noisy) {
      state.analysisErrors.forEach((e) => console.error(e))
    }
    return state.data
  } catch (e) {
    throw new Error(`Failed to walk ${file}\n${e.message}`)
  }
}
