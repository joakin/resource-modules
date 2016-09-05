
extension.json / ResourceModules

    RLmodulename: {
      dependencies: [ ...RLmodulename ]
      scripts: [ ...files ]
      templates: [ ...[id, filename] ]
      i18n: [ ...keys ]
    }

From code

    {
      filename: {
        requires: [ ...MFmodulename ]
        mw_requires: [ ...mw.<blah> ]
        async_requires: [ ...RLmodulename ]
        defines: [ ...MFmodulename ]
        templates: [ ...[id, filename] ]
        i18n: [ ...keys ]
      }
    }


## What
- Dead files: Check all files are in extension.json
- Validate templates and i18n in extension.json where the JS file appears
- Validate order of scripts[] in modulename
- Unused defines
- Validate dependencies based on source dependencies
  * There's resource modules information in hooks files and stuff
- Unit test visitors
* Extract and test the analisis-to-errors in cli.js
* Validate template files exist
* Track async RLmodules too to theck if async requires are in async loaded
  RLmodules
* Fill information about files defining mw.<name>
  - Detect creation of mw.blah.blah = ... and put it in mw_defines
  * Validate mw_requires with mw_defines as we did above
* Do duplicate entries in extension.json result in duplicate sources in the
  bundles?
* Collapsing RL modules into bigger modules

## How


