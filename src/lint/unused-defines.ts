import {Analysis} from '../analyze'
import {FileAnalysis} from '../visitors/types'
import {Module, UnusedDefine} from './types'

export default function getUnusedDefinesErrors (
  ana: FileAnalysis, inModules: Module[], analysis: Analysis
): UnusedDefine[] {
  // Unused defines
  if (ana.defines && ana.defines.length) {
    return ana.defines.filter((mfId) =>
      // If mfId is not required somewhere with with M.require
      !Object.keys(analysis.files).map((f: string): [string, FileAnalysis] => [f, analysis.files[f]])
        .some(([f, fa]: [string, FileAnalysis]): boolean =>
          (fa.requires && Array.isArray(fa.requires) && fa.requires.indexOf(mfId) > -1) ||
          (fa.async_requires && Array.isArray(fa.async_requires) && fa.async_requires.indexOf(mfId) > -1)
        ))
  }
  return []
}
