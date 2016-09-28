// @flow

import type {FileAnalysis} from '../visitors/types'
import type {Module, MissingMessage} from './types'
const {getDependenciesWithMessage} = require('./helpers')

module.exports = function getMissingMessagesErrors (ana: FileAnalysis, inModules: Module[], resourceModules: Object): MissingMessage[] {
  // Messages
  if (ana.messages && ana.messages.length > 0) {
    return ana.messages.reduce((errs, msg) => {
      // Modules with missing messages
      const missing = inModules.filter(([name, module]) =>
        // Keep as missing if no dependencies have the message
        getDependenciesWithMessage(msg, name, resourceModules).length === 0)
      if (missing.length > 0) errs.push({ message: msg, modules: missing })
      return errs
    }, [])
  }
  return []
}
