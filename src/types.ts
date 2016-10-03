interface ResourceModuleTemplate {
  [name: string]: string
}

export interface ResourceModule {
  templates?: ResourceModuleTemplate,
  messages?: string[]|{[key: string]: string|any},
  dependencies?: string[]|string,
  scripts?: string[],
  styles?: string[]
}

export interface ResourceModules {
  [moduleName: string]: ResourceModule
}

export interface ExtensionJson {
  ResourceModules: ResourceModules
}
