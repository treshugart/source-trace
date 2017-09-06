#!/usr/bin/env node

const sourceTrace = require("..");
const yargs = require("yargs");
const { _, ...opts } = yargs.argv;

(async function() {
  console.log((await sourceTrace(_[0], opts)).join("\n"));
})();
