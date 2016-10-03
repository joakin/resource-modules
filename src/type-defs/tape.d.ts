declare module "tape" {
  function test (subject: string, cb: (t: any) => void): void
  export = test 
}
