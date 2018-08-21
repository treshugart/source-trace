#!/usr/bin/env node

const { trace } = require("..");
const yargs = require("yargs");
const { _, ...opts } = yargs.argv;

(async () => {
  const traced = await trace(_[0], {
    ignore() {
      return false;
    }
  });
  console.log(traced.map(d => d.resolvedPath).join("\n"));
})();
