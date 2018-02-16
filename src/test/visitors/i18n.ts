import test = require("tape");

import { walk } from "../../analyze";
import i18n from "../../visitors/i18n";
import { fileAnalysis } from "../../visitors/types";

const files = {
  a: {
    source: `
    mw.msg( 'banana' )
    mw.msg( 'phone' )
    `
  },
  b: {
    source: `
    mw.msg( variable )
    `
  }
};

test("tracks mw.msg's labels in .messages", t => {
  t.deepEqual(
    walk(i18n, files.a.source, "a"),
    fileAnalysis({
      messages: ["banana", "phone"],
      source: files.a.source
    })
  );
  t.end();
});

test("Warns against using mw.msg with non string literals", t => {
  t.throws(() => {
    walk(i18n, files.b.source, "b");
  }, /mw.msg must be used with string literals/);
  t.end();
});
