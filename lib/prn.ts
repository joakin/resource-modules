import {inspect} from 'util'

export default function prn (x: any, out: boolean = false): string|void {
  if (out) {
    console.dir(x, {depth: undefined, colors: true})
  } else {
    return inspect(x, {depth: undefined, colors: true})
  }
}
