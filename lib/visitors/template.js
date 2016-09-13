// @flow

import type {Node} from 'acorn'
import type {VisitorMap} from 'acorn/dist/walk'
import type {Template, State} from './types'

const {isTemplate} = require('./ast-helpers')
const prn = require('../prn-ast')
const equal = require('deep-equal')

const visitor: VisitorMap<State> = {
  CallExpression (node: Node, {data}: State, ancestors: Node[]) {
    if (
      node.type === 'CallExpression' &&
      isTemplate(node)
    ) {
      const tpl: Template = {
        module: node.arguments[0].type === 'Literal' ? node.arguments[0].value : '',
        fileName: node.arguments[1].type === 'Literal' ? node.arguments[1].value : ''
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
module.exports = visitor
