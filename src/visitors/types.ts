export type MWDefine = MWNamespace | MWAssignment

interface MWNamespace {
  type: 'namespace',
  name: string,
  definitions: string[]
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

export interface State {
  data: FileAnalysis,
  file: string,
  analysisErrors: string[]
}

