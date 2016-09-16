
declare type acorn$Location             = {start: {column: number, line: number}}
declare type acorn$Node                 = acorn$Identifier | acorn$MemberExpression | acorn$CallExpression | acorn$ArrayExpression
declare type acorn$Identifier           = {loc: acorn$Location, type: 'Identifier', name: string, value: string}
declare type acorn$MemberExpression     = {loc: acorn$Location, type: 'MemberExpression', object: acorn$Node, property: acorn$Node}
declare type acorn$CallExpression       = {loc: acorn$Location, type: 'CallExpression', callee: acorn$Node, arguments: acorn$Node[]}
declare type acorn$ArrayExpression      = {loc: acorn$Location, type: 'ArrayExpression', elements: acorn$Node[]}
declare type acorn$AssignmentExpression = {loc: acorn$Location, type: 'AssignmentExpression', left: acorn$Node, right: acorn$Node}
declare type acorn$ObjectExpression     = {loc: acorn$Location, type: 'ObjectExpression', properties: acorn$Property[]}
declare type acorn$Property             = {loc: acorn$Location, type: 'Property', key: acorn$Node, value: acorn$Node}

declare module "acorn" {
  declare export type Node = acorn$Node
  declare export function parse (source: string, options: {[key: string]: boolean}): Node
}

declare module "acorn/dist/walk" {
  declare export type Visitor<T> = (node: acorn$Node, state: T, ancestors: acorn$Node[]) => void
  declare export type VisitorMap<T> = {[key: string]: Visitor<T>}
  declare export function ancestor<T>(ast: acorn$Node, visitors: VisitorMap<T>, base: null, initialState: T): void
}
