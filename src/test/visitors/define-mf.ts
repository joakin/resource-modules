import test = require("tape");

import { walk } from "../../analyze";
import define from "../../visitors/define-mf";
import { fileAnalysis } from "../../visitors/types";

const files = {
  a: {
    source: `
    M.define('a', banana)
    mw.mobileFrontend.define('b', banana)
    `
  },
  aa: { source: `M.define(variable, banana)` },
  aaa: { source: `mw.mobileFrontend.define(variable, banana)` }
};

test("tracks usages of M.define in its various forms in .requires", t => {
  t.deepEqual(
    walk(define, files.a.source, "a"),
    fileAnalysis({ defines: ["a", "b"], source: files.a.source })
  );
  t.end();
});

test("doesn't allow usage of define in its various forms with non-string literals", t => {
  t.throws(() => {
    walk(define, files.aa.source, "aa");
  }, /Define must be used with string literals/);
  t.throws(() => {
    walk(define, files.aaa.source, "aaa");
  }, /Define must be used with string literals/);
  t.end();
});
