# resource-modules

[![](https://travis-ci.org/joakin/resource-modules.svg)](https://travis-ci.org/joakin/resource-modules)

CLI tool that lints frontend resources in mediawiki extensions. Analyzes the
sources and builds a dependency tree from source, and then lints that
information with the extension.json ResourceModules declarations.

It assumes the mediawiki extension contains a `resources/` folder with the
frontend assets and a `extension.json` file with a `ResourceModules` key with
the ResourceLoader configuration.

See [T146748](https://phabricator.wikimedia.org/T146748) for more information.

## Install

You can install it globally and use it from the command line:

    npm install -g resource-modules
    resource-modules ~/mediawiki-vagrant/mediawiki/extensions/Popups/

You can also set it up locally for your project:

    npm install --save-dev resource-modules
    # Add a script in package.json
    #   "scripts": {
    #     "lint": "resource-modules ./"
    #   }
    npm run lint

## Features

* Templates
  * Forces usage of `mw.template.get` with string literals (no variables)
  * Complains when template used in source is not on ResourceModules
* i18n messages
  * Forces usage of `mw.msg` with string literals
  * Complains when message used in source is not on its ResourceModule or other
    modules in the dependency graph
* Unused files
  * Warns about files not defined in any ResourceModules
    * Only warning because there may be files loaded on hooks depending on
      runtime checks
* MobileFrontend modules (`mw.mobileFrontend.define`
  & `mw.mobileFrontend.require`)
  * Complains about unused `M.define`s
  * Checks that `M.require`d modules are `M.define`d in some dependency script
    (in same ResourceModule or a dependency)
* MobileFrontend modules (`mw.mobileFrontend.define`
  & `mw.mobileFrontend.require`)
  * Complains about unused `M.define`s
  * Checks that `M.require`d modules are `M.define`d in some dependency script
    (in same ResourceModule or a dependency)
* Global `mw` namespaces/usages
  * Tracks global definitions of `mw.X = { ... }`, `mw.X.Y = ...` and
    `$.extend( mw.X, { Y: ... } )`, from the extension and core.
  * Tracks usages of `mw.X` in sources
  * Complains when used `mw.X` globals are not in previously defined scripts in
    ResourceModules

### Disabling linting

Sometimes there are highly dynamic interactions on the code that can't be
linted, for example, MobileFrontend using messages defined on VisualEditor, so
they aren't in MobileFrontend's extension.json.

In those cases, use `// resource-modules-disable-line` in the line that is
giving you the lint error to avoid parsing of that line and thus the error.
Example:

```js
  // ...
  switchToolbar.setup( [
    {
      type: 'list',
      icon: 'edit',
      title: mw.msg( 'visualeditor-mweditmode-tooltip' ), //resource-modules-disable-line
      include: [ 'editModeVisual', 'editModeSource' ]
    }
  ] );
```

### Possible future improvements

* Track and lint the broken version of `require/module.exports` that
  ResourceLoader exposes (ResourceModule based scope instead of file based
  scope like in common.js modules)
* Lint for messages defined in resource modules not used in sources or
  dependent sources
* Lint async requires to be correct too
* Automatic restructuring/collapsing of ResourceModules configuration
* Validate template files actually exist

## Development

`resource-modules` requires node.js 6+ and is written in typed javascript using
[typescript][]

    npm install
    npm start /path/to/mediawiki/extension

To run the type checker, and tests:

    npm test

If you want to run them in watch mode:

    npm install -g nodemon
    nodemon -e "ts" -w src/ --exec "npm test"

[typescript]: https://typescript.org/
