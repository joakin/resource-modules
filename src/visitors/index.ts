import {Node} from 'acorn'
import {Visitor, VisitorMap} from 'acorn/dist/walk'

import {State} from './types'

import visitorRequire from './require'
import visitorDefine from './define'
import visitorTemplate from './template'
import visitorI18n from './i18n'
import visitorRequireMw from './require-mw'
import visitorDefineMw from './define-mw'

const visitor: VisitorMap<State> = combineVisitors([
  visitorRequire,
  visitorDefine,
  visitorTemplate,
  visitorI18n,
  visitorRequireMw,
  visitorDefineMw
])
export default visitor

interface ByKey {
  [nodeType: string]: Visitor<State>[]
}

function combineVisitors (visitors: VisitorMap<State>[]): VisitorMap<State> {
  let byKey: ByKey = visitors.reduce((a: ByKey, obj: VisitorMap<State>): ByKey => {
    Object.keys(obj).forEach((nodeType: string): void => {
      const visitor: Visitor<State> = obj[nodeType]
      a[nodeType] = a[nodeType] || []
      a[nodeType].push(visitor)
    })
    return a
  }, {})
  return Object.keys(byKey).reduce((a: VisitorMap<State>, nodeType: string): VisitorMap<State> => {
    let visitors: Visitor<State>[] = byKey[nodeType]
    a[nodeType] = (node: Node, st: State, ancestors: Node[]): void =>
      visitors.forEach((visitor: Visitor<State>) => {
        try {
          visitor(node, st, ancestors)
        } catch (e) {
          st.analysisErrors.push(`\nOn file: ${st.file}\n${e.message}`)
        }
      })
    return a
  }, {})
}
