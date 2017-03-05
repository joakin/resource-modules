import * as path from 'path'
import {exec} from 'child_process'
import {ResourceModules} from '../types'

export function getPhpConfig (dir: string, file: string): Promise<ResourceModules> {
  return new Promise((resolve, reject) => {
    // Back to root, since this file will be dist/php/index.js
    const phpFile = path.join(__dirname, '../..', 'src/php/resources.php')
    exec(`php ${phpFile} ${dir} ${file}`, (error, stdout, stderr) => {
      if (error) return reject(error)
      console.error(stderr)
      resolve(stdout)
    })
  }).then((t) => (<ResourceModules>JSON.parse(t.toString())))
}
