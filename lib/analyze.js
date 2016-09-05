const acorn = require('acorn')
const walk = require('acorn/dist/walk')

const {getSources} = require('./fs')

module.exports = {
  analyzeFiles,
  parse,
  walk: walkAst
}

// String -> List String -> Map String Visitor
function analyzeFiles (dir, jsFiles, visitors) {
  return getSources(dir, jsFiles)
    .then((files) => {
      Object.keys(files).forEach((f) =>
        walkAst(visitors, files, f))
      return { files }
    })
}

// String -> Ast
function parse (source) {
  return acorn.parse(source, {locations: true})
}

// walkAst :
//   Map String Visitor
//   -> Map String {source, ...}
//   -> String
//   -> Map String {source, ...}
function walkAst (visitors, files, file) {
  const ast = parse(files[file].source)
  walk.ancestor(ast, visitors, null, {file, data: files[file]})
  return files
}
