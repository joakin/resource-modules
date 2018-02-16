import { FileAnalysis } from "../visitors/types";
import { Module, MissingMessage } from "./types";
import { getDependenciesWithMessage } from "./helpers";
import { ResourceModules } from "../types";

export default function getMissingMessagesErrors(
  ana: FileAnalysis,
  inModules: Module[],
  resourceModules: ResourceModules
): MissingMessage[] {
  // Messages
  if (ana.messages && ana.messages.length > 0) {
    return ana.messages.reduce(
      (errs: MissingMessage[], msg: string): MissingMessage[] => {
        // Modules with missing messages
        const missing = inModules.filter(
          ([name, module]: Module): boolean =>
            // Keep as missing if no dependencies have the message
            getDependenciesWithMessage(msg, name, resourceModules).length === 0
        );
        if (missing.length > 0) errs.push({ message: msg, modules: missing });
        return errs;
      },
      []
    );
  }
  return [];
}
