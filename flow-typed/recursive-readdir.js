declare module "recursive-readdir" {
  declare module.exports: (dir: string, cb: (err: Error|void, files: string[]) => void) => void
}
