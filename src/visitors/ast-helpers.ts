import prn from '../prn-ast'

import {Node} from 'acorn'

export function isI18n (node: Node): boolean {
  if (
    node.type === 'CallExpression' &&
    isObjectAccess('mw', 'msg', node.callee) &&
    node.arguments.length === 1
  ) {
    if (node.arguments[0].type !== 'Literal') {
      throw new Error(
        `mw.msg must be used with string literals for consistency\n${prn(node)}`)
    }
    return true
  }

  return false
}

export function isTemplate (node: Node): boolean {
  if (
    node.type === 'CallExpression' &&
    isObjectAccess('mw.template', 'get', node.callee) &&
    node.arguments.length === 2
  ) {
    if (
      node.arguments[0].type !== 'Literal' ||
      node.arguments[1].type !== 'Literal'
    ){
      throw new Error(
        `mw.template.get must be used with string literals for consistency\n${prn(node)}`)
    }
    return true
  }

  return false
}

export function isMFDefine (node: Node): boolean {
  if (
    node.type === 'CallExpression' && (
      isObjectAccess('M', 'define', node.callee) ||
      isObjectAccess('mw.mobileFrontend', 'define', node.callee) &&
      node.arguments.length === 2
    )
  ) {
    if (node.arguments[0].type !== 'Literal') {
      throw new Error(
        `Define must be used with string literals for consistency\n${prn(node)}`)
    }
    return true
  }

  return false
}

export function isRequire (node: Node): boolean {
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' && named('require', node.callee) &&
    node.arguments.length === 2
  ) {
    if (node.arguments[0].type !== 'Literal') {
      throw new Error(
        `Require must be used with string literals for consistency\n${prn(node)}`)
    }
    return true
  }

  return false
}

export function isMFRequire (node: Node): boolean {
  if (
    node.type === 'CallExpression' && (
      isObjectAccess('M', 'require', node.callee) ||
      isObjectAccess('mw.mobileFrontend', 'require', node.callee)
    ) &&
    node.arguments.length === 1
  ) {
    if (node.arguments[0].type !== 'Literal') {
      throw new Error(
        `M.require must be used with string literals for consistency\n${prn(node)}`)
    }
    return true
  }

  return false
}

export function isMwLoader (node: Node): boolean {
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' && (
      // mw.loader.using( ... ).done( ... )
      // loader.loadModule( ... ).done( ... )
      (node.callee.object.type === 'CallExpression' &&
      (
        isObjectAccess('mw.loader', 'using', node.callee.object.callee) ||
        isObjectAccess('loader', 'loadModule', node.callee.object.callee)
      )) ||
      // mw.loader.using( ..., ..., ... )
      (node.callee.object.type === 'MemberExpression' &&
      (
        isObjectAccess('mw.loader', 'using', node.callee)
      ))
    )
  ) {
    const firstArgument = (
      // mw.loader.using( ... ).done( ... )
      // loader.loadModule( ... ).done( ... )
      (node.callee.object.type === 'CallExpression' && node.callee.object.arguments) ||
      // mw.loader.using( ..., ..., ... )
      node.arguments
    )[0]
    if (!(
      firstArgument.type === 'Literal' ||
      (firstArgument.type === 'ArrayExpression' &&
        firstArgument.elements.every((n) => n.type === 'Literal'))
    )) {
      throw new Error(
        `mw.loader.using must be used with string literals or an array of literals for consistency\n${prn(node)}`)
    }

    return true
  }

  return false
}

export function isObjectAccess (obj: string, prop: string|null, node: Node): boolean {
  if (node.type !== 'MemberExpression') return false

  const {object, property} = node

  // Check object validity
  if (object.type === 'Identifier' && !named(obj, object)) {
    return false
  } else if (object.type === 'MemberExpression') {
    const parts = obj.split('.')
    const butLast = parts.slice(0, parts.length - 1)
    const last = parts[parts.length - 1]

    if (parts.length > 1 && !isObjectAccess(butLast.join('.'), last, object)) return false
    else if (parts.length === 1 && !isObjectAccess(parts[0], null, object)) return false
  }

  if (object.type !== 'Identifier' && object.type !== 'MemberExpression') return false

  // Check property validity
  if (prop) {
    return property.type === 'Identifier' && named(prop, property)
  } else {
    return true
  }
}

export function is (type: string, obj: {type: string}): boolean {
  return obj.type === type
}

export function named (name: string[]|string, obj: {name: string}): boolean {
  return Array.isArray(name)
  ? name.some((n) => named(n, obj))
  : obj.name === name
}
