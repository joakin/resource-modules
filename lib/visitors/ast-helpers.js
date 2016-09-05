const prn = require('../prn-ast')

module.exports = {
  isI18n,
  isTemplate,
  isDefine,
  isRequire,
  isMwLoader,
  isObjectAccess,
  is,
  named
}

function isI18n (node) {
  const isIt =
    isObjectAccess('mw', 'msg', node.callee)

  if (isIt && !is('Literal', node.arguments[0])) {
    throw new Error(
      `mw.msg must be used with string literals for consistency\n${prn(node)}`)
  }

  return isIt
}

function isTemplate (node) {
  const isIt =
    isObjectAccess('mw.template', 'get', node.callee)

  if (isIt && (!is('Literal', node.arguments[0]) || !is('Literal', node.arguments[1]))) {
    throw new Error(
      `mw.template.get must be used with string literals for consistency\n${prn(node)}`)
  }

  return isIt
}

function isDefine (node) {
  const isIt =
    isObjectAccess('M', 'define', node.callee) ||
    isObjectAccess('mw.mobileFrontend', 'define', node.callee)

  if (isIt && !is('Literal', node.arguments[0])) {
    throw new Error(
      `Define must be used with string literals for consistency\n${prn(node)}`)
  }

  return isIt
}

function isRequire (node) {
  const isIt =
    (is('Identifier', node.callee) && named('require', node.callee)) ||
    isObjectAccess('M', 'require', node.callee) ||
    isObjectAccess('mw.mobileFrontend', 'require', node.callee)

  if (isIt && !is('Literal', node.arguments[0])) {
    throw new Error(
      `Require must be used with string literals for consistency\n${prn(node)}`)
  }

  return isIt
}

function isMwLoader (node) {
  // mw.loader.using( ... ).done( ... )
  // loader.loadModule( ... ).done( ... )
  const isIt = (
    is('CallExpression', node) &&
    is('MemberExpression', node.callee) &&
    is('CallExpression', node.callee.object) &&
    (
      isObjectAccess('mw.loader', 'using', node.callee.object.callee) ||
      isObjectAccess('loader', 'loadModule', node.callee.object.callee)
    )
  )

  if (isIt && !(
    is('Literal', node.callee.object.arguments[0]) ||
    (is('ArrayExpression', node.callee.object.arguments[0]) &&
      node.callee.object.arguments[0].elements.every((n) => is('Literal', n)))
  )) {
    throw new Error(
      `mw.loader.using must be used with string literals or an array of literals for consistency\n${prn(node)}`)
  }

  return isIt
}

function isObjectAccess (obj, prop, node) {
  const parts = obj.split('.')
  return (
    is('MemberExpression', node) &&
    (
      (is('Identifier', node.object) &&
       named(obj, node.object)) ||
      (is('MemberExpression', node.object) &&
       (parts.length > 1 ? isObjectAccess(
         parts.slice(0, parts.length - 1).join('.'),
         parts[parts.length - 1],
         node.object)
       : (parts.length === 1 ? isObjectAccess(
         parts[0],
         null,
         node.object) : false)))
    ) &&
    ((prop &&
      is('Identifier', node.property) &&
      named(prop, node.property)) || (!prop && true))
  )
}

function is (type, obj) { return obj.type === type }

function named (name, obj) {
  return Array.isArray(name)
  ? name.some((n) => named(n, obj))
  : obj.name === name
}
