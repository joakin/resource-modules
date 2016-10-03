import {ResourceModules, ResourceModule} from '../types'

export function getDependenciesWithFile (
  scriptToFind: string, moduleName: string,
  module: ResourceModule|null|undefined, resourceModules: ResourceModules
): string[] {

  if (!module) return []

  let found: string[] = []
  if (module.scripts && module.scripts.indexOf(scriptToFind) > -1) {
    found.push(moduleName)
  }

  if (module.dependencies) {
    if (Array.isArray(module.dependencies)) {
      module.dependencies.forEach((dep: string): void => {
        found = found.concat(getDependenciesWithFile(scriptToFind, dep, resourceModules[dep], resourceModules))
      })
    } else if (typeof module.dependencies === 'string') {
      found = found.concat(getDependenciesWithFile(scriptToFind, module.dependencies, resourceModules[module.dependencies], resourceModules))
    }
  }
  return found
}

export function getDependenciesWithMessage (
  msgToFind: string, moduleName: string, resourceModules: ResourceModules
): string[] {

  const module: ResourceModule = resourceModules[moduleName]

  if (!module) return []

  let found: string[] = []

  if (module.messages) {
    if (
      (Array.isArray(module.messages) &&
       module.messages.indexOf(msgToFind) > -1) ||
      (module.messages.constructor === Object &&
       Object.keys(module.messages).some((weirdKey: string): boolean =>
         weirdKey === msgToFind || (<any>module.messages)[weirdKey] === msgToFind))
    ) {
      found.push(moduleName)
    }
  }

  if (module.dependencies) {
    if (Array.isArray(module.dependencies)) {
      module.dependencies.forEach((dep: string): void => {
        found = found.concat(getDependenciesWithMessage(msgToFind, dep, resourceModules))
      })
    } else if (typeof module.dependencies === 'string') {
      found = found.concat(getDependenciesWithMessage(msgToFind, module.dependencies, resourceModules))
    }
  }
  return found
}

export function getDependenciesWithModule (
  moduleToFind: string, currentModule: string, resourceModules: ResourceModules
): string[] {

  let found: string[] = []
  const module: ResourceModule = resourceModules[currentModule]

  if (module && module.dependencies) {
    if (Array.isArray(module.dependencies)) {
      if (module.dependencies.indexOf(moduleToFind) !== -1) {
        found = found.concat(currentModule)
      }
      module.dependencies.forEach((dep: string) => {
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
