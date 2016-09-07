const getMissingMessagesErrors = require('./missing-messages')
const getMissingTemplatesErrors = require('./missing-templates')
const getUnusedDefinesErrors = require('./unused-defines')
const getDependenciesErrors = require('./dependencies')

module.exports = function lint (analysis, resourceModules) {
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
        missingMessages: getMissingMessagesErrors(ana, inModules, analysis),
        missingTemplates: getMissingTemplatesErrors(ana, inModules, analysis),
        unusedDefines: getUnusedDefinesErrors(ana, inModules, analysis),
        dependencies: getDependenciesErrors(ana, inModules, analysis, file, resourceModules)
      }

      // Check required async dependencies that the module name in
      // mw.loader.using is correct
    }
  })

  return errors
}

function getResourceModulesWithFile (file, resourceModules) {
  return Object.keys(resourceModules)
    .filter((rk) => (resourceModules[rk].scripts || []).indexOf(file.replace(/^\//, '')) > -1)
    .map((rk) => [rk, resourceModules[rk]])
}
