import {Template} from '../visitors/types'

export type Errors = {
  skippedBecauseNotInResourceModules: string[],
  files: {[name: string]: FileErrors}
}

export type FileErrors = {
  missingMessages: MissingMessage[],
  missingTemplates: MissingTemplate[],
  unusedDefines: UnusedDefine[],
  dependencies: any[]
}
export type MissingMessage = [string, Module[]]
export type MissingTemplate = [Template, Module[]]
export type UnusedDefine = string

export type Module = [string, Object]
