// @flow

import type {Node} from 'acorn'

const escodegen = require('escodegen')

function prn (ast: Node[]|Node, justCode?: boolean) {
  return Array.isArray(ast)
    ? ast.map((a) => prn(a, justCode)).join('\n')
    : ((justCode ? '' : `Line ${ast.loc.start.line} Column ${ast.loc.start.column}\n\n`) +
     escodegen.generate(ast) + (justCode ? '' : '\n'))
}

module.exports = prn
