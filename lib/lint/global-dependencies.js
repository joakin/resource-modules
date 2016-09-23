// @flow

import type {Analysis} from '../analyze'
import type {FileAnalysis} from '../visitors/types'
import type {Module, DependencyError} from './types'

// const {getDependenciesWithFile} = require('./helpers')

// const globalIdBlacklist = [
//   'mw.log'
// ]

// const defaultFiles = [
//   'resources/src/mediawiki/mediawiki.js',
//   'resources/src/startup.js',
//   'resources/src/mediawiki/mediawiki.template.js'
// ]

module.exports = function getGlobalDependenciesErrors (ana: FileAnalysis, inModules: Module[], analysis: Analysis, file: string, resourceModules: Object): DependencyError[] {
  // Required dependencies in source that are missing in ResourceModules
  // or not defined in the source
  // (Using the mw global variable)
  // if (ana.mw_requires && ana.mw_requires.length) {
  //   return ana.mw_requires
  //   .filter((id) => !globalIdBlacklist.some((b) => id.indexOf(b) === 0))
  //   .reduce((errs, globalId) => {
  //     // Find out which file defines globalId or a globalId subset (if any)
  //     const whoDefines = Object.keys(analysis.files)
  //       .map((f) => {
  //         const fa = analysis.files[f]
  //         return [
  //           f, fa,
  //           fa.mw_defines && Array.isArray(fa.mw_defines)
  //           ? getSubNames(globalId).filter((id) => fa.mw_defines.indexOf(id) > -1)
  //           : null
  //         ]
  //       })
  //       .filter(([f, fa, matches]) => matches && matches.length)
  //       .map(([f, fa, matches]) => [
  //         f, fa,
  //         (matches &&
  //          matches.reduce((a, b) => a.length > b.length ? a : b)[0]) || null
  //       ])

  //     if (whoDefines.length > 1) {
  //       // Shouldn't happen since we're picking the longest match above
  //       errs.push({kind: 'multiple_defines', id: globalId, where: whoDefines})
  //     } else if (whoDefines.length === 0) {
  //       errs.push({kind: 'not_defined', id: globalId})
  //     } else {
  //       const [definer: string] = whoDefines[0]

  //       // Traverse dependencies of the RLModules where source file is used
  //       // and check file that defines is there somewhere, unless it is one of
  //       // the included by default in mediawiki
  //       if (!defaultFiles.some((exception) => definer.endsWith(exception))) {
  //         inModules.forEach(([name, module]) => {
  //           // Script defined before me, or check my dependencies for it
  //           const inDependencies = getDependenciesWithFile(definer, name, module, resourceModules)
  //             .filter((v, i, arr) => arr.indexOf(v) === i)
  //           if (inDependencies.length > 1) {
  //             errs.push({kind: 'file_in_multiple_dependencies', id: globalId, where: [definer, inDependencies]})
  //           } else if (inDependencies.length === 0) {
  //             errs.push({kind: 'not_found', id: globalId, where: definer})
  //           }
  //         })
  //       }
  //     }

  //     return errs
  //   }, [])
  // }
  return []
}

// function getSubNames (id: string): string[] {
//   const parts = id.split('.')
//   if (parts.length > 2) {
//     return parts.reduce((a, part, i) => {
//       a.current = a.current ? [a.current, part].join('.') : part
//       if (i > 0) {
//         a.names.push(a.current)
//       }
//       return a
//     }, {current: '', names: []}).names
//   }
//   return [id]
// }
