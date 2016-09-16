// @flow

import type {Node} from 'acorn'
import type {VisitorMap} from 'acorn/dist/walk'
import type {State} from './types'

const {isRequire, isMwLoader} = require('./ast-helpers')
const prn = require('../prn-ast')

const visitor: VisitorMap<State> = {
  CallExpression (node: Node, {data}: State, ancestors: Node[]) {
    if (
      node.type === 'CallExpression' &&
      isRequire(node)
    ) {
      const firstArg = node.arguments[0]
      const required = firstArg.type === 'Literal' ? firstArg.value : ''

      if (required === '') throw new Error(`Invalid argument in require:\n${prn(node)}`)

      data.requires = data.requires || []
      data.async_requires = data.async_requires || []

      let where = data.requires
      if (ancestors.filter(isMwLoader).length > 0) {
        where = data.async_requires
      }

      if (where.indexOf(required) !== -1) {
        throw new Error(`Module ${required} already required previously\n${prn(node)}`)
      } else {
        where.push(required)
      }
    }
  }
}
module.exports = visitor
