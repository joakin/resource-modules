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
  },

  CallExpression (node: Node, {data}: State/* , ancestors */): void {
    // Check for $.extend( mw.namespace, {...} )
    let defined = null
    if (
      node.type === 'CallExpression' &&
      is$extend(node.callee) &&
      node.arguments.length === 2
    ) {
      const defined: string = prn(node.arguments[0], true)
      const extender: Node = node.arguments[1]
      if (
        defined.startsWith('mw') &&
        extender.type === 'ObjectExpression'
      ) {
        data.mw_defines = data.mw_defines || []
        addProperties(defined, data.mw_defines, extender.properties)
      }
    }
  }
}
export default visitor

function is$extend (node: Node): boolean {
  return (
    node.type === 'MemberExpression' &&

    node.object.type === 'Identifier' &&
    node.object.name === '$' &&

    node.property.type === 'Identifier' &&
    node.property.name === 'extend'
  )
}

function addNamespace (name: string, defines: MWDefine[]): void {
  if (defines.filter((d) => d.name === name).length) {
    throw new Error(`Duplicate module defined ${name}`)
  }
  defines.push({
    type: 'namespace',
    name
  })
}

function addProperties (name: string, defines: MWDefine[], props: (acorn$Property|string)[]): void {
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
