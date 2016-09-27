// @flow

import type {FileAnalysis} from '../visitors/types'
import type {Module, MissingTemplate} from './types'

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
      }
      return errs
    }, [])
  }
  return []
}
