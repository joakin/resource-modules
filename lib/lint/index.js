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

function getMissingMessagesErrors (ana, inModules, analysis) {
  // Messages
  if (ana.messages && ana.messages.length > 0) {
    return ana.messages.reduce((errs, msg) => {
      // Modules with missing messages
      const missing = inModules.filter(([name, module]) => {
        if (!module.messages) return true
        if (Array.isArray(module.messages)) {
          return module.messages.indexOf(msg) === -1
        }
        if (module.messages.constructor === Object) {
          return !Object.keys(module.messages)
            .some((weirdKey) => module.messages[weirdKey] === msg)
        }
      })
      if (missing.length > 0) errs.push([msg, missing])
      return errs
    }, [])
  }
}

function getMissingTemplatesErrors (ana, inModules, analysis) {
  // Templates
  if (ana.templates && ana.templates.length > 0) {
    // templates: [ { module: template file, fileName: 'Drawer.hogan' } ],
    return ana.templates.reduce((errs, template) => {
      // Modules with missing templates
      const missing = inModules.filter(([name, module]) => {
        if (!module.templates) return true
        if (module.templates.constructor === Object) {
          return !Object.keys(module.templates)
            .some((tplName) => tplName === template.fileName)
        }
        throw new Error(`In module ${name}, templates is not an object`)
      })
      if (missing.length > 0) errs.push([template, missing])
      return errs
    }, [])
  }
}

function getUnusedDefinesErrors (ana, inModules, analysis) {
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
}

function getDependenciesErrors (ana, inModules, analysis, file, resourceModules) {
  // Required dependencies in source that are missing in ResourceModules
  // or not defined in the source (M.define)
  // (Using M.require, require)
  if (ana.requires && ana.requires.length) {
    return ana.requires.reduce((errs, mfId) => {
      // Find out which file defines mfId (if any)
      const whoDefines = Object.keys(analysis.files).map((f) => [f, analysis.files[f]])
        .filter(([f, fa]) =>
          fa.defines && Array.isArray(fa.defines) &&
          fa.defines.indexOf(mfId) > -1)

      if (whoDefines.length > 1) {
        errs.push({kind: 'multiple_defines', id: mfId, where: whoDefines})
      } else if (whoDefines.length === 0) {
        errs.push({kind: 'not_defined', id: mfId, where: whoDefines})
      } else {
        const [definer] = whoDefines[0]

        const getDependenciesWithFile = (scriptToFind, moduleName, module, source) => {
          if (!module) return []

          let found = []
          if (module.scripts && module.scripts.indexOf(scriptToFind) > -1) {
            found.push(moduleName)
          }

          if (module.dependencies) {
            module.dependencies.forEach((dep) => {
              found = found.concat(getDependenciesWithFile(scriptToFind, dep, resourceModules[dep], source))
            })
          }
          return found
        }

        // Traverse dependencies of the RLModules where source file is used
        // and check file that defines is there somewhere
        inModules.forEach(([name, module]) => {
          // Script defined before me, or check my dependencies for it
          const inDependencies = getDependenciesWithFile(definer, name, module, file)
            .filter((v, i, arr) => arr.indexOf(v) === i)
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
}
