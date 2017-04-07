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

export function parse (source: string): { ast: Node, disabled: DisabledLines } {
  const comments: acorn$Comment[] = []
  const ast = acorn.parse(source, {locations: true, onComment: comments})
  return { ast, disabled: getDisabledLines(comments) }
}

export function walk (
  visitors: VisitorMap<State>, source: string, file: string, noisy: boolean = false
): FileAnalysis {
  try {
    const parsedData = parse(source)
    const state: State = {
      file,
      data: fileAnalysis({source}),
      analysisErrors: []
    }
    acornWalk.ancestor(parsedData.ast, visitors, null, state)
    if (noisy) {
      state.analysisErrors.forEach((e) => console.error(e))
    }
    return state.data
  } catch (e) {
    throw new Error(`Failed to walk ${file}\n${e.message}`)
  }
}

interface DisabledLines { [start: number]: number }

function getDisabledLines (comments: acorn$Comment[]): DisabledLines {
  return comments.reduce((lines: DisabledLines, comment: acorn$Comment) => {
    if (comment.value.trim() === 'resource-modules-disable-line' && comment.loc)
      lines[comment.loc.start.line] = comment.loc.end.line
    return lines
  }, {})
}
