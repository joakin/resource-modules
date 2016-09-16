export type Errors = {
  skippedBecauseNotInResourceModules: string[],
  files: {[name: string]: FileErrors}
}

export type FileErrors = {
  missingMessages: MissingMessage[],
  missingTemplates: any[],
  unusedDefines: any[],
  dependencies: any[]
}
export type MissingMessage = [string, Module[]]

export type Module = [string, Object]
