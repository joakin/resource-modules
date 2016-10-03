import {Node} from 'acorn'

import * as escodegen from 'escodegen'

export default function prn (ast: Node[]|Node, justCode?: boolean): string {
  return Array.isArray(ast)
    ? ast.map((a) => prn(a, justCode)).join('\n')
    : ((justCode ? '' : `Line ${ast.loc.start.line} Column ${ast.loc.start.column}\n\n`) +
     escodegen.generate(ast) + (justCode ? '' : '\n'))
}
