// @flow

import type {Analysis} from '../analyze'
import type {FileAnalysis} from '../visitors/types'
import type {Module, DependencyError} from './types'

const {getDependenciesWithFile} = require('./helpers')

const globalIdBlacklist = [
  'mw.log'
]

const defaultFiles = [
  'resources/src/mediawiki/mediawiki.js',
  'resources/src/startup.js',
  'resources/src/mediawiki/mediawiki.template.js'
]

module.exports = function getGlobalDependenciesErrors (ana: FileAnalysis, inModules: Module[], analysis: Analysis, file: string, resourceModules: Object): DependencyError[] {
  // Required dependencies in source that are missing in ResourceModules
  // or not defined in the source
  // (Using the mw global variable)
  if (ana.mw_requires && ana.mw_requires.length) {
    return ana.mw_requires
    // Remove the ones from the global blacklist
    .filter((id) => !globalIdBlacklist.some((b) => id.indexOf(b) === 0))
    .reduce((errs, globalId) => {
      const parts = globalId.split('.')
      const ns = parts.slice(0, parts.length - 1).join('.')
      const def = parts[parts.length - 1]
      // Find out which file defines ns and the def (if any)
      const whoDefines = Object.keys(analysis.files)
        // Get name and analysis paired
        .map((fileName) => [fileName, analysis.files[fileName]])
        // Keep the ones that have that definition
        .filter(([fileName, fileAnalysis]) =>
          fileAnalysis.mw_defines.some((definition) =>
            // The namespace definition is there
            definition.name === ns &&
            // And the definition is there in the namespace
            definition.definitions.indexOf(def) !== -1))

      if (whoDefines.length > 1) {
        errs.push({kind: 'multiple_defines', id: globalId, where: whoDefines})
      } else if (whoDefines.length === 0) {
        errs.push({kind: 'not_defined', id: globalId})
      } else {
        const [definer: string] = whoDefines[0]

        // Traverse dependencies of the RLModules where source file is used
        // and check file that defines is there somewhere, unless it is one of
        // the included by default in mediawiki
        if (!defaultFiles.some((exception) => definer.endsWith(exception))) {
          inModules.forEach(([name, module]) => {
            // Script defined before me, or check my dependencies for it
            const inDependencies = getDependenciesWithFile(definer, name, module, resourceModules)
              // Unique
              .filter((v, i, arr) => arr.indexOf(v) === i)
            if (inDependencies.length > 1) {
              errs.push({kind: 'file_in_multiple_dependencies', id: globalId, where: [definer, inDependencies]})
            } else if (inDependencies.length === 0) {
              errs.push({kind: 'not_found', id: globalId, where: definer})
            }
          })
        }
      }

      return errs
    }, [])
  }
  return []
}
