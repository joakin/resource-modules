// @flow

import type {Analysis} from '../analyze'
import type {FileAnalysis} from '../visitors/types'
import type {Module, UnusedDefine} from './types'

module.exports = function getUnusedDefinesErrors (ana: FileAnalysis, inModules: Module[], analysis: Analysis): UnusedDefine[] {
  // Unused defines
  if (ana.defines && ana.defines.length) {
    return ana.defines.filter((mfId) =>
      // If mfId is not required somewhere with with M.require
      !Object.keys(analysis.files).map((f) => [f, analysis.files[f]])
        .some(([f, fa]) =>
          (fa.requires && Array.isArray(fa.requires) && fa.requires.indexOf(mfId) > -1) ||
          (fa.async_requires && Array.isArray(fa.async_requires) && fa.async_requires.indexOf(mfId) > -1)
        ))
  }
  return []
}
