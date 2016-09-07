module.exports = function getMissingTemplatesErrors (ana, inModules, analysis) {
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
