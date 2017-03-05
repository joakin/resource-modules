import {Errors, FileErrors, MissingMessage} from '../lint/types'

type FileAndErrors = [string, FileErrors]

// Returns success or error code as an int if it has logged errors out
export default function logErrors (errors: Errors): number {
  let exit = 0

  logWarnings(errors)

  const filesWithErrors: FileAndErrors[] = getFilesWithErrors(errors)

  if (filesWithErrors.length > 0) exit = 1

  filesWithErrors.forEach(([file, fileErrors]) => {

    logMissingMessages(file, fileErrors)
    logMissingTemplates(file, fileErrors)
    logUnusedDefines(file, fileErrors)
    logDependencyErrors(file, fileErrors)

  })

  return exit
}

function logWarnings (errors: Errors): void {
  if (errors.skippedBecauseNotInResourceModules.length > 0) {
    console.error('Warning: Not in extension.json (couldn\'t verify):')
    console.error(errors.skippedBecauseNotInResourceModules.map((fileErrors) => '  ' + fileErrors).join('\n'))
  }
}

function getFilesWithErrors (errors: Errors): FileAndErrors[] {
  return Object.keys(errors.files)
    .map((fk: string): FileAndErrors => [fk, errors.files[fk]])
    .filter(([file, fileErrors]: FileAndErrors) => hasErrors(fileErrors))
}

function hasErrors (fileErrors: FileErrors): boolean {
  return Object.keys(fileErrors)
    .some((k: string): boolean =>
      Array.isArray(fileErrors[k]) && (fileErrors[k].length > 0))
}

function logMissingMessages (file: string, fileErrors: FileErrors) {
  if (fileErrors.missingMessages && fileErrors.missingMessages.length > 0) {
    interface MessagesByModule {
      [key: string]: string[]
    }
    const messagesByModule: MessagesByModule = fileErrors.missingMessages.reduce((acc: MessagesByModule, {message, modules}: MissingMessage): MessagesByModule => {
      modules.forEach(([name]) => {
        acc[name] = (acc[name] || [])
        acc[name].push(message)
      })
      return acc
    }, {})

    console.error(`\nError: Missing messages used directly in file: ${file}:`)
    console.error(Object.keys(messagesByModule).map((name) =>
      `  In module ${name}, missing:\n` +
      messagesByModule[name].map((msg) => '    ' + msg).join('\n')
    ).join('\n'))
  }
}

function logMissingTemplates (file: string, fileErrors: FileErrors) {
  if (fileErrors.missingTemplates && fileErrors.missingTemplates.length > 0) {
    fileErrors.missingTemplates.forEach(({kind, template, modules}) => {
      switch (kind) {
        case 'template_not_in_modules':
          console.error(`\nError: Missing template used directly in file: ${file}:`)
          console.error(`  Template: ${template.module} ${template.fileName}`)
          console.error(`    Not found in modules ${modules.join(', ')}`)
          break
        case 'template_not_in_dependencies':
          console.error(`\nError: Template used directly in file: ${file}:`)
          console.error(`  Template not found in dependencies: ${template.module} ${template.fileName}`)
          console.error(`    Not found in dependencies of modules: ${modules.join(', ')}`)
          break
      }
    })
  }
}

function logUnusedDefines (file: string, fileErrors: FileErrors) {
  if (fileErrors.unusedDefines && fileErrors.unusedDefines.length > 0) {
    console.error(`\nError: Unused defines from file: ${file}:`)
    console.error(fileErrors.unusedDefines.map((name) =>
      `  ${name}`
    ).join('\n'))
  }
}

function logDependencyErrors (file: string, fileErrors: FileErrors) {
  if (fileErrors.dependencies && fileErrors.dependencies.length > 0) {
    console.error(`\nError: Dependency problems in file: ${file}:`)
    fileErrors.dependencies.forEach((error) => {
      switch (error.kind) {
        case 'multiple_defines':
          console.error(`  Required ${error.id} defined in multiple files:`)
          console.error(error.where.map(([fileErrors]) => `    ${fileErrors}`).join('\n'))
          break
        case 'not_defined':
          console.error(`  Required ${error.id} not defined in any source files`)
          break
        case 'file_in_multiple_dependencies':
          console.error(`  Required ${error.id} defined in file ${error.where[0]} found in multiple ResourceModules:`)
          console.error(error.where[1].map((m) => `    ${m}`).join('\n'))
          break
        case 'not_found':
          console.error(`  Required ${error.id} defined in file ${error.where} not found in any ResourceModules`)
          break
      }
    })
  }
}
