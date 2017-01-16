import {Node} from 'acorn'
import {VisitorMap} from 'acorn/dist/walk'
import {State} from './types'

import {isObjectAccess} from './ast-helpers'
import prn from '../prn-ast'

const visitor: VisitorMap<State> = {
  MemberExpression (node: Node, {data}: State, ancestors: Node[]) {
    if (
      node.type === 'MemberExpression' &&
      isObjectAccess('mw', null, node) &&
      ( // Ancestors include the current node!
        (ancestors && ancestors.length > 1 &&
         // Get only full member expressions and not the sub-children
         ancestors[ancestors.length - 2].type !== 'MemberExpression' &&
         // Don't get assignments into the member expression
         ancestors[ancestors.length - 2].type !== 'AssignmentExpression'
        ) ||
        (ancestors.length === 0)
      )
    ) {
      const used = prn(node, true)

      data.mw_requires = data.mw_requires || []

      if (data.mw_requires.indexOf(used) === -1) {
        data.mw_requires.push(used)
      }
    }
  }
}
export default visitor
