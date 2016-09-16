// @flow

import type {Analysis} from '../analyze'
import type {FileAnalysis} from '../visitors/types'
import type {Module, DependencyError} from './types'

const {getDependenciesWithFile} = require('./helpers')

module.exports = function getGlobalDependenciesErrors (ana: FileAnalysis, inModules: Module[], analysis: Analysis, file: string, resourceModules: Object): DependencyError[] {
  // Required dependencies in source that are missing in ResourceModules
  // or not defined in the source
  // (Using the mw global variable)
  if (ana.mw_requires && ana.mw_requires.length) {
    return ana.mw_requires.reduce((errs, globalId) => {
      // Find out which file defines globalId or a globalId subset (if any)
      const whoDefines = Object.keys(analysis.files).map((f) => [f, analysis.files[f]])
        .filter(([f, fa]) =>
          fa.mw_defines && Array.isArray(fa.mw_defines) &&
          getSubNames(globalId).some((id) => fa.mw_defines.indexOf(id) > -1))

      if (whoDefines.length > 1) {
        errs.push({kind: 'multiple_defines', id: globalId, where: whoDefines})
      } else if (whoDefines.length === 0) {
        errs.push({kind: 'not_defined', id: globalId})
      } else {
        const [definer: string] = whoDefines[0]

        // Traverse dependencies of the RLModules where source file is used
        // and check file that defines is there somewhere
        inModules.forEach(([name, module]) => {
          // Script defined before me, or check my dependencies for it
          const inDependencies = getDependenciesWithFile(definer, name, module, resourceModules)
            .filter((v, i, arr) => arr.indexOf(v) === i)
          if (inDependencies.length > 1) {
            errs.push({kind: 'file_in_multiple_dependencies', id: globalId, where: [definer, inDependencies]})
          } else if (inDependencies.length === 0) {
            errs.push({kind: 'not_found', id: globalId, where: definer})
          }
        })
      }

      return errs
    }, [])
  }
  return []
}

function getSubNames (id: string): string[] {
  const parts = id.split('.')
  if (parts.length > 2) {
    return parts.reduce((a, part, i) => {
      a.current = a.current ? [a.current, part].join('.') : part
      if (i > 0) {
        a.names.push(a.current)
      }
      return a
    }, {current: '', names: []}).names
  }
  return [id]
}
