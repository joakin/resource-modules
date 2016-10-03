export interface ResourceModule {
  templates: string[],
  messages: string[]|{[key: string]: string},
  dependencies: string[]|string,
  scripts: string[],
  styles: string[]
}

export interface ResourceModules {
  [moduleName: string]: ResourceModule
}

export interface ExtensionJson {
  ResourceModules: ResourceModules
}
