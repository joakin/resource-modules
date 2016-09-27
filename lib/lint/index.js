// @flow

import type {Analysis} from '../analyze'
import type {Errors, Module} from './types'

const getMissingMessagesErrors = require('./missing-messages')
const getMissingTemplatesErrors = require('./missing-templates')
const getUnusedDefinesErrors = require('./unused-defines')
const getDependenciesErrors = require('./dependencies')
const getGlobalDependenciesErrors = require('./global-dependencies')

module.exports = function lint (analysis: Analysis, coreAnalysis: Analysis, resourceModules: Object): Errors {
  const fullAnalysis = [coreAnalysis, analysis].reduce((all, ana) => ({
    files: Object.assign(all.files, ana.files)
  }), {files: {}})

  // Match analysis info with extension.json info
  let errors = {
    skippedBecauseNotInResourceModules: [],
    files: {}
  }

  Object.keys(analysis.files).forEach((file) => {
    const inModules = getResourceModulesWithFile(file, resourceModules)

    // Check that analysis data is included in resourceModules
    if (inModules.length < 1) {
      errors.skippedBecauseNotInResourceModules.push(file)
    } else {
      const ana = analysis.files[file]
      errors.files[file] = {
        missingMessages: getMissingMessagesErrors(ana, inModules),
        missingTemplates: getMissingTemplatesErrors(ana, inModules, resourceModules),
        unusedDefines: getUnusedDefinesErrors(ana, inModules, fullAnalysis),
        dependencies: getDependenciesErrors(ana, inModules, fullAnalysis, file, resourceModules)
          .concat(getGlobalDependenciesErrors(ana, inModules, fullAnalysis, file, resourceModules))
      }
    }
  })

  return errors
}

function getResourceModulesWithFile (file: string, resourceModules: Object): Module[] {
  return Object.keys(resourceModules)
    .filter((rk) => (resourceModules[rk].scripts || []).indexOf(file.replace(/^\//, '')) > -1)
    .map((rk) => [rk, resourceModules[rk]])
}
