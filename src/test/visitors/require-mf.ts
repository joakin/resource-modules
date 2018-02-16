import test = require("tape");

import { walk } from "../../analyze";
import requireMF from "../../visitors/require-mf";
import { fileAnalysis } from "../../visitors/types";

const files = {
  a: {
    source: `
    var a = M.require('a')
    var b = require('b')
    var c = mw.mobileFrontend.require('c')
    `
  },
  aa: {
    source: `var a = M.require(a)`
  },
  cc: {
    source: `var c = mw.mobileFrontend.require(c)`
  },
  d: {
    source: `
    mw.loader.using('resourceloadermodule').done(() => {
      var a = M.require('a')
      var b = require('b')
      var c = mw.mobileFrontend.require('c')
    })
    loader.loadModule('resourceloadermodule').done(() => {
      var d = M.require('d')
      var e = require('e')
      var f = mw.mobileFrontend.require('f')
    })
    mw.loader.using('resourceloadermodule', () => {
      var g = M.require('g')
      var h = require('h')
      var i = mw.mobileFrontend.require('i')
    }, () => console.log('banana'))
    `
  }
};

test("tracks usages of require in its various forms in .requires", t => {
  t.deepEqual(
    walk(requireMF, files.a.source, "a"),
    fileAnalysis({
      async_requires: [],
      requires: ["a", "c"],
      source: files.a.source
    })
  );
  t.end();
});

test("doesn't allow usage of require in its various forms with non-string literals", t => {
  t.throws(() => {
    walk(requireMF, files.aa.source, "aa");
  }, /M.require must be used with string literals/);
  t.throws(() => {
    walk(requireMF, files.cc.source, "cc");
  }, /M.require must be used with string literals/);
  t.end();
});

test("tracks usages of async requires in its various forms in .async_requires", t => {
  t.deepEqual(
    walk(requireMF, files.d.source, "d"),
    fileAnalysis({
      async_requires: ["a", "c", "d", "f", "g", "i"],
      requires: [],
      source: files.d.source
    })
  );
  t.end();
});
