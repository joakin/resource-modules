// @flow

const escodegen = require('escodegen')

function prn (ast: Object[]|Object, justCode?: boolean) {
  return Array.isArray(ast)
    ? ast.map((a) => prn(a, justCode)).join('\n')
    : ((justCode ? '' : `Line ${ast.loc.start.line} Column ${ast.loc.start.column}\n\n`) +
     escodegen.generate(ast) + (justCode ? '' : '\n'))
}

module.exports = prn
