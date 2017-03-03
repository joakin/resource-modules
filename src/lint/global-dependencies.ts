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
  'mw.language',
  'mw.message'
]

const defaultFiles = [
  'resources/src/mediawiki/mediawiki.js',
  'resources/src/mediawiki/mediawiki.util.js',
  'resources/src/startup.js',
  'resources/src/mediawiki/mediawiki.template.js',
  'resources/src/mediawiki/mediawiki.requestIdleCallback.js'
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

      // Find out which file defines as ns
      const whoDefinesAsNamespace: FileAndAnalysis[] = fileAndAnalysis
        .filter(([fileName, fileAnalysis]: FileAndAnalysis) =>
          fileAnalysis.mw_defines.some((definition) =>
            definition.type === 'namespace' &&
            // The namespace definition is there
            definition.name === globalId
          ))

      // Find out which file defines as assignment
      const whoDefinesAsAssignment: FileAndAnalysis[] = fileAndAnalysis
        .filter(([fileName, fileAnalysis]: FileAndAnalysis) =>
          fileAnalysis.mw_defines.some((definition) =>
            // Or assigned to a variable beforehand without an explicit
            // namespace
            definition.type === 'assignment' &&
            definition.name === globalId
          ))

      // Find out which file defines ns
      const whoDefinesNamespace: FileAndAnalysis[] = fileAndAnalysis
        .filter(([fileName, fileAnalysis]: FileAndAnalysis) =>
          fileAnalysis.mw_defines.some((definition) =>
            definition.type === 'namespace' &&
            // The namespace definition is there
            definition.name === ns
          ))

      const definitions = whoDefinesAsNamespace.length + whoDefinesAsAssignment.length

      if (definitions > 1) {
        errs.push({
          kind: 'multiple_defines',
          id: globalId,
          where: whoDefinesAsNamespace.concat(whoDefinesAsAssignment)
        })
      } else if (definitions === 0) {
        errs.push({kind: 'not_defined', id: globalId})
      } else if (definitions === 1) {

        const [user, userAna]: FileAndAnalysis =
          whoDefinesAsAssignment.length === 1 ? whoDefinesAsAssignment[0] : whoDefinesAsNamespace[0]

        checkDefinerFile(errs, user, inModules, globalId, resourceModules)

        // Check the vars' namespace
        if (whoDefinesNamespace.length > 1) {
          errs.push({
            kind: 'multiple_defines',
            id: ns,
            where: whoDefinesNamespace
          })
        } else if (whoDefinesNamespace.length === 0) {
          errs.push({kind: 'not_defined', id: ns})
        } else if (whoDefinesNamespace.length === 1) {

          // Namespace definer needs to be in the dependencies
          const [definer, definerAna]: FileAndAnalysis = whoDefinesNamespace[0]
          checkDefinerFile(errs, definer, inModules, globalId, resourceModules)

          // // If the namespace definer doesn't define the property, we check
          // // there's one of the assignments beforehand
          // if (
          //   definerAna.mw_defines.some((definition: MWDefine) =>
          //     definition.type === 'namespace' &&
          //     // The namespace definition is there
          //     definition.name === ns /*&&
          //     definition.definitions.indexOf(def) === -1*/
          //   )
          // ) {
          //   // And then we give up
          //   const assigners: string[] = whoDefinesAsAssignment.map(([fileName]: FileAndAnalysis) => fileName)
          //   // Need to check that at least one is assigned before hand
          //   const anyAssignersInDeps: boolean = assigners
          //     .reduce((foundAssignerDep: boolean, definer: string) => {
          //       if (!foundAssignerDep) {
          //         const tmpErrs : DependencyError[] = []
          //         checkDefinerFile(tmpErrs, definer, inModules, globalId, resourceModules)
          //         if (tmpErrs.length === 0) {
          //           // File that assigns is in dep tree, works for us
          //           return true
          //         } else {
          //           // File not found, keep looking
          //           return false
          //         }
          //       }
          //       return foundAssignerDep
          //     }, false)

          //   if (!anyAssignersInDeps) {
          //     errs.push({kind: 'not_found', id: globalId, where: assigners.join(', ')})
          //   }
          // }
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
  // and check file that defines is there somewhere

  // Only if it is NOT one of the included by default in mediawiki
  if (!isDefaultMediawikiFile(definer)) {
    inModules.forEach(([name, module]: Module): void => {
      // Script defined before me, or check my dependencies for it
      const inDependencies: string[] = getDependenciesWithFile(definer, name, module, resourceModules)
        // Unique
        .filter((v, i, arr) => arr.indexOf(v) === i)
      if (inDependencies.length > 1) {
        pushUniq({
          kind: 'file_in_multiple_dependencies',
          id: globalId,
          where: [definer, inDependencies]
        }, errs)
      } else if (inDependencies.length === 0) {
        pushUniq({
          kind: 'not_found', id: globalId, where: definer
        }, errs)
      }
    })
  }
}

function pushUniq (obj: Object, arr: Array<Object>): void {
  if (!arr.find((o) => deepEqual(obj, o))) arr.push(obj)
}

function deepEqual (o1: any, o2: any): boolean {
  if (typeof o1 !== typeof o2) return false
  if (typeof o1 !== 'object' && typeof o2 !== 'object') {
    return o1 === o2
  } else {
    if (Array.isArray(o1) !== Array.isArray(o2)) return false
    else if (Array.isArray(o1) && Array.isArray(o2)) {
      if (o1.length !== o2.length) return false
      return o1.every((x, i) => deepEqual(x, o2[i]))
    } else {
      var o1Keys = Object.keys(o1)
      var o2Keys = Object.keys(o2)
      if (o1Keys.length !== o2Keys.length) return false
      return o1Keys.every((k, i) => deepEqual(o1[k], o2[o2Keys[i]]))
    }
  }
}

function isDefaultMediawikiFile (file: string): boolean {
  return defaultFiles.some(
    (defaultFile: string) => file.endsWith(defaultFile)
  )
}
