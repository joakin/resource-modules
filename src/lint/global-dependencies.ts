import {Analysis} from '../analyze'
import {FileAnalysis, MWDefine} from '../visitors/types'
import {Module, DependencyError} from './types'
import {ResourceModules} from '../types'

import {getDependenciesWithFile} from './helpers'

const globalIdBlacklist = [
  // Weird definition in core
  'mw.log',
  // Properly defined in mediawiki.js but extended weirdly in mediawiki.user.js
  'mw.user',
  // Defined in a iife of 1700 lines long. Not worth it
  'mw.loader',
  // Properly defined in mediawiki.language/mediawiki.language.init.js but
  // extended in mediawiki.language.js with jquery
  'mw.language'
]

const defaultFiles = [
  'resources/src/mediawiki/mediawiki.js',
  'resources/src/mediawiki/mediawiki.util.js',
  'resources/src/startup.js',
  'resources/src/mediawiki/mediawiki.template.js'
]

export default function getGlobalDependenciesErrors (
  ana: FileAnalysis, inModules: Module[], analysis: Analysis, file: string, resourceModules: ResourceModules
): DependencyError[] {

  type FileAndAnalysis = [string, FileAnalysis]

  // Required dependencies in source that are missing in ResourceModules
  // or not defined in the source
  // (Using the mw global variable)
  if (ana.mw_requires && ana.mw_requires.length) {
    return ana.mw_requires
    // Remove the ones from the global blacklist
    .filter((id: string) => !globalIdBlacklist.some((b) => id.indexOf(b) === 0))
    .reduce((errs: DependencyError[], globalId: string): DependencyError[] => {
      const parts = globalId.split('.')
      const ns = parts.slice(0, parts.length - 1).join('.')
      const def = parts[parts.length - 1]
      const fileAndAnalysis: FileAndAnalysis[] = Object.keys(analysis.files)
        // Get name and analysis paired
        .map((fileName: string): FileAndAnalysis => [fileName, analysis.files[fileName]])

      // Find out which file defines ns and the def (if any)
      const whoDefinesNamespace: FileAndAnalysis[] = fileAndAnalysis
        .filter(([fileName, fileAnalysis]: FileAndAnalysis) =>
          fileAnalysis.mw_defines.some((definition) =>
            definition.type === 'namespace' &&
            // The namespace definition is there
            definition.name === ns
          ))

      // Find out which file assigns ns (opaque ns if not defined)
      const whoDefinesNamespaceAssigning: FileAndAnalysis[] = fileAndAnalysis
        .filter(([fileName, fileAnalysis]: FileAndAnalysis) =>
          fileAnalysis.mw_defines.some((definition) =>
            definition.type === 'assignment' &&
            // The namespace definition is there
            definition.name === ns
          ))

      // Find out which file defines ns and the def (if any)
      const whoDefinesAssigning: FileAndAnalysis[] = fileAndAnalysis
        .filter(([fileName, fileAnalysis]: FileAndAnalysis) =>
          fileAnalysis.mw_defines.some((definition) =>
            // Or assigned to a variable beforehand without an explicit
            // namespace
            definition.type === 'assignment' &&
            definition.name === globalId
          ))

      if (whoDefinesNamespace.length > 1) {
        errs.push({kind: 'multiple_defines', id: globalId, where: whoDefinesNamespace})
      } else if (
        // If there's 1 namespace definition but the variable is not defined
        // there and it is not assigned anywhere else
        whoDefinesNamespace.length === 1 &&
        whoDefinesNamespace[0][1].mw_defines.some((definition) =>
          definition.type === 'namespace' &&
          // The namespace definition is there
          definition.name === ns &&
          definition.definitions.indexOf(def) === -1
        ) &&
        whoDefinesAssigning.length === 0
      ) {
        errs.push({kind: 'not_defined', id: globalId})
      } else if (whoDefinesNamespace.length === 0) {
        if (whoDefinesNamespaceAssigning.length === 0) {
          // If the namespace is not defined anywhere and it is not assigned to
          // anywhere complain about it not existing
          errs.push({kind: 'not_defined', id: ns})
        }
      } else {
        // There is 1 namespace definition
        // And either that defines the var or it is on whoDefinesAssigning

        // Namespace definer needs to be in the dependencies
        const [definer, definerAna]: FileAndAnalysis = whoDefinesNamespace[0]
        checkDefinerFile(errs, definer, inModules, globalId, resourceModules)

        // If the namespace definer doesn't define the property, we check
        // there's one of the assignments beforehand
        if (
          definerAna.mw_defines.some((definition: MWDefine) =>
            definition.type === 'namespace' &&
            // The namespace definition is there
            definition.name === ns &&
            definition.definitions.indexOf(def) === -1
          )
        ) {
          // And then we give up
          const assigners: string[] = whoDefinesAssigning.map(([fileName]: FileAndAnalysis) => fileName)
          // Need to check that at least one is assigned before hand
          const anyAssignersInDeps: boolean = assigners
            .reduce((foundAssignerDep: boolean, definer: string) => {
              if (!foundAssignerDep) {
                const tmpErrs = []
                checkDefinerFile(tmpErrs, definer, inModules, globalId, resourceModules)
                if (tmpErrs.length === 0) {
                  // File that assigns is in dep tree, works for us
                  return true
                } else {
                  // File not found, keep looking
                  return false
                }
              }
              return foundAssignerDep
            }, false)

          if (!anyAssignersInDeps) {
            errs.push({kind: 'not_found', id: globalId, where: assigners.join(', ')})
          }
        }
      }

      return errs
    }, [])
  }
  return []
}

function checkDefinerFile (
  errs: DependencyError[], definer: string, inModules: Module[], globalId: string, resourceModules: ResourceModules
): void {
  // Traverse dependencies of the RLModules where source file is used
  // and check file that defines is there somewhere, unless it is one of
  // the included by default in mediawiki
  if (!defaultFiles.some((exception: string) => definer.endsWith(exception))) {
    inModules.forEach(([name, module]: Module): void => {
      // Script defined before me, or check my dependencies for it
      const inDependencies: string[] = getDependenciesWithFile(definer, name, module, resourceModules)
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
