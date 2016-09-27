import type {FileAnalysis, Template} from '../visitors/types'

export type Errors = {
  skippedBecauseNotInResourceModules: string[],
  files: {[name: string]: FileErrors}
}

export type FileErrors = {
  missingMessages: MissingMessage[],
  missingTemplates: MissingTemplate[],
  unusedDefines: UnusedDefine[],
  dependencies: DependencyError[]
}
export type MissingMessage = [string, Module[]]
export type UnusedDefine = string
export type MissingTemplate = TemplateNotInModules

type TemplateNotInModules = {
  kind: 'template_not_in_modules',
  template: Template,
  modules: Module[]
}

export type DependencyError
  = MultipleDefines
  | NotDefined
  | FileInMultipleDependencies
  | NotFound

type MultipleDefines = { kind: 'multiple_defines', id: string, where: [string, FileAnalysis] }
type NotDefined = { kind: 'not_defined', id: string }
type FileInMultipleDependencies = { kind: 'file_in_multiple_dependencies', id: string, where: [string, string[]] }
type NotFound = { kind: 'not_found', id: string, where: string }

export type Module = [string, Object]
