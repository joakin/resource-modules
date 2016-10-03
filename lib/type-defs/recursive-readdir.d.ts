declare module "recursive-readdir" {
  function recursiveReadDir (
    dir: string,
    cb: (err: Error|void, files: string[]) => void
  ): void
  export = recursiveReadDir
}
