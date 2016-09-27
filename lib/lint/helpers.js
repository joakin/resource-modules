// @flow

module.exports = {
  getDependenciesWithFile,
  getDependenciesWithModule
}

function getDependenciesWithFile (scriptToFind: string, moduleName: string, module?: Object, resourceModules: Object): string[] {
  if (!module) return []

  let found = []
  if (module.scripts && module.scripts.indexOf(scriptToFind) > -1) {
    found.push(moduleName)
  }

  if (module.dependencies) {
    if (Array.isArray(module.dependencies)) {
      module.dependencies.forEach((dep) => {
        found = found.concat(getDependenciesWithFile(scriptToFind, dep, resourceModules[dep], resourceModules))
      })
    } else if (typeof module.dependencies === 'string') {
      found = found.concat(getDependenciesWithFile(scriptToFind, module.dependencies, resourceModules[module.dependencies], resourceModules))
    }
  }
  return found
}

function getDependenciesWithModule (moduleToFind: string, currentModule: string, resourceModules: Object): string[] {
  let found = []
  const module = resourceModules[currentModule]
  if (module && module.dependencies) {
    if (Array.isArray(module.dependencies)) {
      if (module.dependencies.indexOf(moduleToFind) !== -1) {
        found = found.concat(currentModule)
      }
      module.dependencies.forEach((dep) => {
        found = found.concat(getDependenciesWithModule(moduleToFind, dep, resourceModules))
      })
    } else if (
      typeof module.dependencies === 'string' &&
      module.dependencies === moduleToFind
    ) {
      found = found.concat(currentModule)
    }
  }
  return found
}
