declare module "acorn" {
  declare export function parse (source: string, options: {[key: string]: boolean}): Object
}

declare module "acorn/dist/walk" {
  declare type Visitor = (node: Object, state: Object, ancestors: Object[]) => void
  declare export function ancestor<T>(ast: Object, visitors: {[key: string]: Visitor}, base: null, initialState: T): void
}
