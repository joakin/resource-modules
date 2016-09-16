// @flow

module.exports = {
  getDependenciesWithFile
}

function getDependenciesWithFile (scriptToFind: string, moduleName: string, module?: Object, resourceModules: Object): string[] {
  if (!module) return []

  let found = []
  if (module.scripts && module.scripts.indexOf(scriptToFind) > -1) {
    found.push(moduleName)
  }

  if (module.dependencies) {
    module.dependencies.forEach((dep) => {
      found = found.concat(getDependenciesWithFile(scriptToFind, dep, resourceModules[dep], resourceModules))
    })
  }
  return found
}
