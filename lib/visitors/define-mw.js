// @flow

import type {Node} from 'acorn'
import type {VisitorMap} from 'acorn/dist/walk'
import type {State} from './types'

const {isObjectAccess} = require('./ast-helpers')
const prn = require('../prn-ast')

const visitor: VisitorMap<State> = {
  AssignmentExpression (node: Node, {data}: State/* , ancestors */) {
    if (
      node.type === 'AssignmentExpression' &&
      isObjectAccess('mw', null, node.left)
    ) {
      const defined = prn(node.left, true)

      data.mw_defines = data.mw_defines || []

      if (data.mw_defines.indexOf(defined) !== -1) {
        throw new Error(`Module ${defined} already defined previously\n${prn(node)}`)
      } else {
        data.mw_defines.push(defined)

        if (node.right.type === 'ObjectExpression') {
          node.right.properties.forEach((prop) => {
            if (prop.key.type === 'Identifier') {
              data.mw_defines.push([defined, prop.key.name].join('.'))
            } else {
              throw new Error(`Module ${defined} uses a non literal key: ${prn(prop.key)}\n${prn(node)}`)
            }
          })
        }
      }
    }
  }
}
module.exports = visitor
