import test = require("tape");

import { walk } from "../../analyze";
import defineMw from "../../visitors/define-mw";
import { fileAnalysis } from "../../visitors/types";

test("tracks definition of mw.<...> namespaces", t => {
  const files = {
    a: {
      source: `
      mw.banana = {}
      `
    }
  };
  t.deepEqual(
    walk(defineMw, files.a.source, "a"),
    fileAnalysis({
      mw_defines: [
        {
          type: "namespace",
          name: "mw.banana"
        }
      ],
      source: files.a.source
    })
  );
  t.end();
});

test("tracks definitions in mw.<...> namespace object", t => {
  const files = {
    b: {
      source: `
      mw.banana = {
        phone: 1,
        ring: function () {}
      }
      `
    }
  };
  t.deepEqual(
    walk(defineMw, files.b.source, "b"),
    fileAnalysis({
      mw_defines: [
        {
          type: "namespace",
          name: "mw.banana"
        },
        {
          type: "assignment",
          name: "mw.banana.phone"
        },
        {
          type: "assignment",
          name: "mw.banana.ring"
        }
      ],
      source: files.b.source
    })
  );
  t.end();
});

test("tracks standalone definitions mw.<...>.<...>", t => {
  const files = {
    c: {
      source: `
      mw.banana = {}
      mw.banana.phone = 1
      mw.banana.ring = function () {}
      `
    }
  };
  t.deepEqual(
    walk(defineMw, files.c.source, "c"),
    fileAnalysis({
      mw_defines: [
        {
          type: "namespace",
          name: "mw.banana"
        },
        {
          type: "assignment",
          name: "mw.banana.phone"
        },
        {
          type: "assignment",
          name: "mw.banana.ring"
        }
      ],
      source: files.c.source
    })
  );
  t.end();
});

test("tracks usage of mw.<...> as assignments if namespace not defined in file", t => {
  const files = {
    d: {
      source: `
      mw.banana.phone = 1
      mw.banana.ring = function () {}
      `
    }
  };
  t.deepEqual(
    walk(defineMw, files.d.source, "d"),
    fileAnalysis({
      mw_defines: [
        {
          type: "assignment",
          name: "mw.banana.phone"
        },
        {
          type: "assignment",
          name: "mw.banana.ring"
        }
      ],
      source: files.d.source
    })
  );
  t.end();
});

test("doesn'nt track definition of other variables", t => {
  const files = {
    e: {
      source: `
      this.banana = 1
      a.b = 2
      `
    }
  };
  t.deepEqual(
    walk(defineMw, files.e.source, "e"),
    fileAnalysis({
      mw_defines: [],
      source: files.e.source
    })
  );
  t.end();
});

test("tracks definition of mw namespace", t => {
  const files = {
    f: {
      source: `
      mw = {
        a: 1
      }
      `
    }
  };
  t.deepEqual(
    walk(defineMw, files.f.source, "f"),
    fileAnalysis({
      mw_defines: [
        {
          type: "namespace",
          name: "mw"
        },
        {
          type: "assignment",
          name: "mw.a"
        }
      ],
      source: files.f.source
    })
  );
  t.end();
});

test("doesnt track definition of null properties", t => {
  const files = {
    g: {
      source: `
      mw = {
        a: null
      }
      `
    }
  };
  t.deepEqual(
    walk(defineMw, files.g.source, "g"),
    fileAnalysis({
      mw_defines: [
        {
          type: "namespace",
          name: "mw"
        }
      ],
      source: files.g.source
    })
  );
  t.end();
});

test("tracks nested definitions mw.<...>.<...>", t => {
  const files = {
    h: {
      source: `
      mw.banana = {}
      mw.banana.phone = {}
      mw.banana.phone.ring = function () {}
      `
    }
  };
  t.deepEqual(
    walk(defineMw, files.h.source, "h"),
    fileAnalysis({
      mw_defines: [
        {
          type: "namespace",
          name: "mw.banana"
        },
        {
          type: "namespace",
          name: "mw.banana.phone"
        },
        {
          type: "assignment",
          name: "mw.banana.phone.ring"
        }
      ],
      source: files.h.source
    })
  );
  t.end();
});

test("tracks assignments using $.extend expressions", t => {
  const files = {
    g: {
      source: `
      $.extend( mw.banana, {
        phone: '',
        apple: ''
      } );
      `
    }
  };
  t.deepEqual(
    walk(defineMw, files.g.source, "g"),
    fileAnalysis({
      mw_defines: [
        {
          type: "assignment",
          name: "mw.banana.phone"
        },
        {
          type: "assignment",
          name: "mw.banana.apple"
        }
      ],
      source: files.g.source
    })
  );
  t.end();
});
