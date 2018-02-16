import { FileAnalysis, Template } from "../visitors/types";
import { ResourceModule } from "../types";

export interface Errors {
  skippedBecauseNotInResourceModules: string[];
  files: { [name: string]: FileErrors };
}

export interface FileErrors {
  [name: string]: any;
  missingMessages: MissingMessage[];
  missingTemplates: MissingTemplate[];
  unusedDefines: UnusedDefine[];
  dependencies: DependencyError[];
}
export interface MissingMessage {
  message: string;
  modules: Module[];
}
export type UnusedDefine = string;
export type MissingTemplate = TemplateNotInModules | TemplateNotInDependencies;

interface TemplateNotInModules {
  kind: "template_not_in_modules";
  template: Template;
  modules: Module[];
}
interface TemplateNotInDependencies {
  kind: "template_not_in_dependencies";
  template: Template;
  modules: Module[];
}

export type DependencyError =
  | MultipleDefines
  | NotDefined
  | FileInMultipleDependencies
  | NotFound;

interface MultipleDefines {
  kind: "multiple_defines";
  id: string;
  where: [string, FileAnalysis][];
}
interface NotDefined {
  kind: "not_defined";
  id: string;
}
interface FileInMultipleDependencies {
  kind: "file_in_multiple_dependencies";
  id: string;
  where: [string, string[]];
}
interface NotFound {
  kind: "not_found";
  id: string;
  where: string;
}

export type Module = [string, ResourceModule];
