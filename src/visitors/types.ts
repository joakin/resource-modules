export type MWDefine = MWNamespace | MWAssignment

interface MWNamespace {
  type: 'namespace',
  name: string
}

interface MWAssignment {
  type: 'assignment',
  name: string
}

export interface Template {
  module: string,
  fileName: string
}

export interface FileAnalysis {
  source: string,
  requires: string[],
  async_requires: string[],
  defines: string[],
  templates: Template[],
  messages: string[],
  mw_requires: string[],
  mw_defines: MWDefine[]
}

export function fileAnalysis (extra: Object): FileAnalysis {
  return Object.assign({}, {
    source: '',
    requires: [],
    async_requires: [],
    defines: [],
    templates: [],
    messages: [],
    mw_requires: [],
    mw_defines: []
  }, extra)
}

export type DisabledLines = { start: number, end: number }[]

export interface State {
  disabledLines: DisabledLines,
  data: FileAnalysis,
  file: string,
  analysisErrors: string[]
}

