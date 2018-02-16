import { Node } from "acorn";
import { VisitorMap } from "acorn/dist/walk";
import { State } from "./types";

import { isI18n } from "./ast-helpers";
import prn from "../prn-ast";

const visitor: VisitorMap<State> = {
  CallExpression(node: Node, { data }: State, ancestors: Node[]) {
    if (node.type === "CallExpression" && isI18n(node)) {
      const firstArg = node.arguments[0];
      const key = firstArg.type === "Literal" ? firstArg.value : "";

      if (key === "")
        throw new Error(`Invalid argument in i18n:\n${prn(node)}`);

      data.messages = data.messages || [];

      if (data.messages.indexOf(key) === -1) {
        data.messages.push(key);
      }
    }
  }
};
export default visitor;
