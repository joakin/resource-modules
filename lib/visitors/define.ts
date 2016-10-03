import {Node} from 'acorn'
import {VisitorMap} from 'acorn/dist/walk'
import {State} from './types'

import {isDefine} from './ast-helpers'
import prn from '../prn-ast'

const visitor: VisitorMap<State> = {
  CallExpression (node: Node, {data}: State, ancestors: Node[]) {
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
export default visitor
