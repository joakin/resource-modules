// @flow

import type {FileAnalysis} from '../visitors/types'
import type {Module, MissingTemplate} from './types'
const {getDependenciesWithModule} = require('./helpers')

module.exports = function getMissingTemplatesErrors (ana: FileAnalysis, inModules: Module[], resourceModules: Object): MissingTemplate[] {
  // Templates
  if (ana.templates && ana.templates.length > 0) {
    // templates: [ { module: template file, fileName: 'Drawer.hogan' } ],
    return ana.templates.reduce((errs, template) => {
      // Modules with missing templates
      const missing = inModules.filter(([name, module]) => {
        if (template.module === name) {
          if (!module.templates) return true
          if (module.templates.constructor === Object) {
            return !Object.keys(module.templates)
              .some((tplName) => tplName === template.fileName)
          }
          throw new Error(`In module ${name}, templates is not an object`)
        } else {
          const submoduleTemplates = resourceModules[template.module] &&
            resourceModules[template.module].templates
          return !(submoduleTemplates && submoduleTemplates[template.fileName])
        }
      })
      if (missing.length > 0) {
        errs.push({
          kind: 'template_not_in_modules',
          template: template,
          modules: missing
        })
        // If template is not in modules, it's not going to be in dependencies.
        // Return to skip superfluous errors
        return errs
      }

      // Modules with templates not in dependencies
      const missingDependencies = inModules.filter(([name, module]) => {
        if (template.module !== name) {
          const depsWithModule = getDependenciesWithModule(template.module, name, resourceModules)
          if (depsWithModule.length === 0) return true
        }
        return false
      })
      if (missingDependencies.length > 0) {
        errs.push({
          kind: 'template_not_in_dependencies',
          template: template,
          modules: missingDependencies
        })
      }

      return errs
    }, [])
  }
  return []
}
