const acorn = require('acorn')
const walk = require('acorn/dist/walk')

const {getSources} = require('./fs')

module.exports = {
  analyzeFiles,
  parse
}

// String -> List String -> ({source}, file) => Map String {source, ...}
function analyzeFiles (dir, jsFiles, matchers) {
  return getSources(dir, jsFiles)
    .then((files) => {
      Object.keys(files).forEach((f) =>
        walkAst(matchers, files, f))
      return { files }
    })
}

// String -> Ast
function parse (source) {
  return acorn.parse(source, {locations: true})
}

// walkAst :
//   ({source, ...}, file: String) => Map String {source, ...}
//   -> Map String {source, ...}
//   -> String
//   -> Map String {source, ...}
function walkAst (matchers, files, file) {
  const ast = parse(files[file].source)
  walk.ancestor(ast, matchers, null, {file, data: files[file]})
  return files
}
