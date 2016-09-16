// @flow

import type {Node} from 'acorn'
import type {VisitorMap} from 'acorn/dist/walk'
import type {State} from './types'

const {isObjectAccess} = require('./ast-helpers')
const prn = require('../prn-ast')

const visitor: VisitorMap<State> = {
  AssignmentExpression (node: Node, {data}: State/* , ancestors */): void {
    if (node.type === 'AssignmentExpression') {
      data.mw_defines = data.mw_defines || []

      if (
        node.left.type === 'Identifier' &&
        node.left.name === 'mw' &&
        node.right.type === 'ObjectExpression'
      ) {
        addProperties('mw', data.mw_defines, node.right.properties)
      } else if (isObjectAccess('mw', null, node.left)) {
        const defined = prn(node.left, true)

        if (data.mw_defines.indexOf(defined) !== -1) {
          throw new Error(`Module ${defined} already defined previously\n${prn(node)}`)
        } else {
          data.mw_defines.push(defined)

          if (node.right.type === 'ObjectExpression') {
            addProperties(defined, data.mw_defines, node.right.properties)
          }
        }
      }
    }
  }
}
module.exports = visitor

/* global acorn$Property */
function addProperties (prefix: string, arr: string[], props: acorn$Property[]) {
  props.forEach((prop) => {
    if (
      prop.key.type === 'Identifier' &&
      !(prop.value.type === 'Literal' && prop.value.raw === 'null')
    ) {
      arr.push([prefix, prop.key.name].join('.'))
    }
  })
}
