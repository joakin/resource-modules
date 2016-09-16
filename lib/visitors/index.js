// @flow

import type {Node} from 'acorn'
import type {Visitor, VisitorMap} from 'acorn/dist/walk'

import type {State} from './types'

const visitor: VisitorMap<State> = combineVisitors([
  require('./require'),
  require('./define'),
  require('./template'),
  require('./i18n'),
  require('./require-mw'),
  require('./define-mw')
])
module.exports = visitor

function combineVisitors (visitors: VisitorMap<State>[]): VisitorMap<State> {
  let byKey: {[nodeType: string]: Visitor<State>[]} = visitors.reduce((a, obj) => {
    Object.keys(obj).forEach((nodeType) => {
      const visitor = obj[nodeType]
      a[nodeType] = a[nodeType] || []
      a[nodeType].push(visitor)
    })
    return a
  }, {})
  return Object.keys(byKey).reduce((a, nodeType) => {
    let visitors = byKey[nodeType]
    a[nodeType] = (node: Node, st: State, ancestors: Node[]) =>
      visitors.forEach((visitor) => {
        try {
          visitor(node, st, ancestors)
        } catch (e) {
          st.analysisErrors.push(`\nOn file: ${st.file}\n${e.message}`)
        }
      })
    return a
  }, {})
}
