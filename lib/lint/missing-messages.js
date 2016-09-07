module.exports = function getMissingMessagesErrors (ana, inModules, analysis) {
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
