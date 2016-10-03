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

## Development

`resource-modules` requires node.js 4+ and is written in typed javascript using
[typescript][]

    npm install
    npm start /path/to/mediawiki/extension

To run the linter, type checker, and tests:

    npm test

If you want to run them in watch mode:

    npm install -g nodemon
    nodemon --exec "npm test"

[typescript]: https://typescript.org/
