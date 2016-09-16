// @flow

export type Template = {
  module: string,
  fileName: string
}

export type FileAnalysis = {
  source: string,
  requires: string[],
  async_requires: string[],
  defines: string[],
  templates: Template[],
  messages: string[],
  mw_requires: string[],
  mw_defines: string[]
}

exports.fileAnalysis = function (extra: Object): FileAnalysis {
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

export type State = {
  data: FileAnalysis,
  file: string,
  analysisErrors: string[]
}

