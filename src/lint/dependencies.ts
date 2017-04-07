import {Analysis} from '../analyze'
import {FileAnalysis} from '../visitors/types'
import {Module, DependencyError} from './types'
import {ResourceModules} from '../types'

import {getDependenciesWithFile} from './helpers'

export default function getDependenciesErrors (
  ana: FileAnalysis, inModules: Module[], analysis: Analysis,
  file: string, resourceModules: ResourceModules
): DependencyError[] {

  type FileAndAnalysis = [string, FileAnalysis]

  // Required dependencies in source that are missing in ResourceModules
  // or not defined in the source (M.define)
  // (Using M.require, require)
  if (ana.requires && ana.requires.length) {
    return ana.requires.reduce((errs: DependencyError[], mfId: string): DependencyError[] => {
      // Find out which file defines mfId (if any)
      const whoDefines: FileAndAnalysis[] = Object.keys(analysis.files)
        .map((f: string): FileAndAnalysis => [f, analysis.files[f]])
        .filter(([f, fa]: FileAndAnalysis): boolean =>
          fa.defines && Array.isArray(fa.defines) &&
          fa.defines.indexOf(mfId) > -1)

      if (whoDefines.length > 1) {
        errs.push({
          kind: 'multiple_defines',
          id: mfId, where: whoDefines.sort(([f1, _], [f2, __]) => f1 > f2 ? 1 : -1)
        })
      } else if (whoDefines.length === 0) {
        errs.push({kind: 'not_defined', id: mfId})
      } else {
        const definer: string = whoDefines[0][0]

        // Traverse dependencies of the RLModules where source file is used
        // and check file that defines is there somewhere
        inModules.forEach(([name, module]: Module): void => {
          // Script defined before me, or check my dependencies for it
          const inDependencies: string[] = getDependenciesWithFile(definer, name, module, resourceModules)
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .sort()
          if (inDependencies.length > 1) {
            errs.push({kind: 'file_in_multiple_dependencies', id: mfId, where: [definer, inDependencies]})
          } else if (inDependencies.length === 0) {
            errs.push({kind: 'not_found', id: mfId, where: definer})
          }
        })
      }

      return errs
    }, [])
  }
  return []
}
