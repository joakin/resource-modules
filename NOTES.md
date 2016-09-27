
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
- Extract and test the analisis-to-errors in cli.js (lint)
- Fill information about files defining mw.<name>
  - Detect creation of mw.blah.blah = ... and put it in mw_defines
  - Validate mw_requires with mw_defines as we did above
    - Get resourcemodules definitions from core's php file resources.php
    - Fix mw_defines to be mw.<...> = {} for namespaces and add it's properties
      there
    - Test the validation of mw_requires and mw_defines
* Move require/module.exports out of require/define.js and properly check
  them using the resourcemodules definitions
* Lint for unused messages in resource modules definitions/files
* Track async mw.loader.using(str[], fn, fn) also, not only the .done version
* Track async RLmodules too to theck if async requires are in async loaded
  RLmodules
* See if we can include visualeditor's modules in extension.json but not load
  them
* Do duplicate entries in extension.json result in duplicate sources in the
  bundles?
* Collapsing RL modules into bigger modules
* Validate template files exist
* Check required async dependencies that the module name in mw.loader.using is
  correct

