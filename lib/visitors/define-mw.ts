import {Node} from 'acorn'
import {VisitorMap} from 'acorn/dist/walk'
import {MWDefine, State} from './types'

import prn from '../prn-ast'

const visitor: VisitorMap<State> = {
  AssignmentExpression (node: Node, {data}: State/* , ancestors */): void {
    if (node.type === 'AssignmentExpression') {
      data.mw_defines = data.mw_defines || []

      const defined = prn(node.left, true)

      if (defined.startsWith('mw')) {
        if (
          node.right.type === 'ObjectExpression'
        ) {
          addNamespace(defined, data.mw_defines)
          addProperties(defined, data.mw_defines, node.right.properties)
        } else {
          const parts = defined.split('.')
          const ns = parts.slice(0, parts.length - 1).join('.')
          const def = parts[parts.length - 1]
          addProperties(ns, data.mw_defines, [def])
        }
      }
    }
  }
}
export default visitor

function addNamespace (name: string, defines: MWDefine[]): void {
  if (defines.filter((d) => d.name === name).length) {
    throw new Error(`Duplicate module defined ${name}`)
  }
  defines.push({
    type: 'namespace',
    name,
    definitions: []
  })
}

function addProperties (name: string, defines: MWDefine[], props: (acorn$Property|string)[]): void {
  const namespaceMatches = defines.filter((d) => d.type === 'namespace' && d.name === name)
  if (namespaceMatches.length === 1) {
    const ns = namespaceMatches[0]
    if (ns.type === 'namespace') {
      props.forEach((prop) => {
        if (typeof prop === 'string') {
          ns.definitions.push(prop)
        } else if (
          prop.key.type === 'Identifier' &&
          !(prop.value.type === 'Literal' && prop.value.raw === 'null')
        ) {
          ns.definitions.push(prop.key.name)
        }
      })
    }
  } else if (namespaceMatches.length === 0) {
    props.forEach((prop) => {
      if (typeof prop === 'string') {
        defines.push({
          type: 'assignment',
          name: [name, prop].join('.')
        })
      } else if (
        prop.key.type === 'Identifier' &&
        !(prop.value.type === 'Literal' && prop.value.raw === 'null')
      ) {
        defines.push({
          type: 'assignment',
          name: [name, prop.key.name].join('.')
        })
      }
    })
  }
}
