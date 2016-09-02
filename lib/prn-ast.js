const escodegen = require('escodegen')

function prn (ast, justCode) {
  return Array.isArray(ast)
    ? ast.map(prn).join('\n')
    : ((justCode ? '' : `Line ${ast.loc.start.line} Column ${ast.loc.start.column}\n\n`) +
     escodegen.generate(ast) + (justCode ? '' : '\n'))
}

module.exports = prn
