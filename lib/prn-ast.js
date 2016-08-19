const escodegen = require('escodegen')

function prn (ast) {
  return Array.isArray(ast) ?
    ast.map(prn).join('\n') :
    (`Line ${ast.loc.start.line} Column ${ast.loc.start.column}\n\n` +
     escodegen.generate(ast) + '\n')
}

module.exports = prn
