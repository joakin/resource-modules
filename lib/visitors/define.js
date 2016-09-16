// @flow

import type {Node} from 'acorn'
import type {VisitorMap} from 'acorn/dist/walk'
import type {State} from './types'

const {isDefine} = require('./ast-helpers')
const prn = require('../prn-ast')

const visitor: VisitorMap<State> = {
  CallExpression (node: Node, {data}: State, ancestors) {
    if (
      node.type === 'CallExpression' &&
      isDefine(node)
    ) {
      const firstArg = node.arguments[0]
      const defined = firstArg.type === 'Literal' ? firstArg.value : ''

      if (defined === '') throw new Error(`Invalid argument in define:\n${prn(node)}`)

      data.defines = data.defines || []

      if (data.defines.indexOf(defined) !== -1) {
        throw new Error(`Module ${defined} already defined previously\n${prn(node)}`)
      } else {
        data.defines.push(defined)
      }
    }
  }
}
module.exports = visitor
