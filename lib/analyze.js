const acorn = require('acorn')
const walk = require('acorn/dist/walk')

const {getSources} = require('./fs')

module.exports = {
  analyzeFiles
}

// String -> List String -> ({source}, file) => Map String {source, ...}
function analyzeFiles (dir, jsFiles, matchers) {
  return getSources(dir, jsFiles)
    .then((files) => {
      Object.keys(files).forEach((f) =>
        walkAst(matchers, files, f, parseFile(files[f].source)))
      return { files }
    })
}

// String -> Ast
function parseFile (source) {
  return acorn.parse(source, {locations: true})
}

// walkAst :
//   ({source}, file) => Map String {source, ...}
//   -> Map String {source, ...}
//   -> String
//   -> Ast
function walkAst (matchers, files, file, ast) {
  walk.ancestor(ast, matchers(files[file], file))
  return files
}
