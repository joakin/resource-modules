declare interface acorn$Location {
  start: { column: number; line: number };
}

declare type acorn$Node =
  | acorn$Literal
  | acorn$Identifier
  | acorn$MemberExpression
  | acorn$CallExpression
  | acorn$ArrayExpression
  | acorn$AssignmentExpression
  | acorn$ObjectExpression;

declare interface acorn$Literal {
  loc: acorn$Location;
  type: "Literal";
  raw: string;
  value: string;
}

declare interface acorn$Identifier {
  loc: acorn$Location;
  type: "Identifier";
  name: string;
  value: string;
}

declare interface acorn$MemberExpression {
  loc: acorn$Location;
  type: "MemberExpression";
  object: acorn$Node;
  property: acorn$Node;
}

declare interface acorn$CallExpression {
  loc: acorn$Location;
  type: "CallExpression";
  callee: acorn$Node;
  arguments: acorn$Node[];
}

declare interface acorn$ArrayExpression {
  loc: acorn$Location;
  type: "ArrayExpression";
  elements: acorn$Node[];
}

declare interface acorn$AssignmentExpression {
  loc: acorn$Location;
  type: "AssignmentExpression";
  left: acorn$Node;
  right: acorn$Node;
}

declare interface acorn$ObjectExpression {
  loc: acorn$Location;
  type: "ObjectExpression";
  properties: acorn$Property[];
}

declare interface acorn$Property {
  loc: acorn$Location;
  type: "Property";
  key: acorn$Node;
  value: acorn$Node;
}

declare interface acorn$Comment {
  type: "Line" | "Block";
  value: string;
  start: number;
  end: number;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  range?: [number, number];
}

declare module "acorn" {
  interface ParseOptions {
    locations?: boolean;
    onComment?: acorn$Comment[];
  }
  export type Node = acorn$Node;
  export function parse(source: string, options: ParseOptions): Node;
}

declare module "acorn/dist/walk" {
  export interface Visitor<T> {
    (node: acorn$Node, state: T, ancestors: acorn$Node[]): void;
  }
  export interface VisitorMap<T> {
    [key: string]: Visitor<T>;
  }

  export function ancestor<T>(
    ast: acorn$Node,
    visitors: VisitorMap<T>,
    base: null,
    initialState: T
  ): void;
}
