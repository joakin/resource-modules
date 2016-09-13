// @flow

import type {Node} from 'acorn'
import type {VisitorMap} from 'acorn/dist/walk'

const {isObjectAccess} = require('./ast-helpers')
const prn = require('../prn-ast')

const visitor: VisitorMap = {
  AssignmentExpression (node: Node, {data}: {data: Object}/* , ancestors */) {
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
      }
    }
  }
}
module.exports = visitor
