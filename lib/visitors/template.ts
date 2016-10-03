import {Node} from 'acorn'
import {VisitorMap} from 'acorn/dist/walk'
import {Template, State} from './types'

import {isTemplate} from './ast-helpers'
import prn from '../prn-ast'
import equal = require('deep-equal')

const visitor: VisitorMap<State> = {
  CallExpression (node: Node, {data}: State, ancestors: Node[]) {
    if (
      node.type === 'CallExpression' &&
      isTemplate(node)
    ) {
      const [first, second]: [Node, Node] = [node.arguments[0], node.arguments[1]]
      const tpl: Template = {
        module: first.type === 'Literal' ? first.value : '',
        fileName: second.type === 'Literal' ? second.value : ''
      }

      data.templates = data.templates || []

      if (data.templates.some((t) => equal(t, tpl))) {
        throw new Error(`Template ${JSON.stringify(tpl)} already required previously\n${prn(node)}`)
      } else {
        data.templates.push(tpl)
      }
    }
  }
}
export default visitor
