#!/usr/bin/env node

const sourceTrace = require("..");
const yargs = require("yargs");
const { _, ...opts } = yargs.argv;

console.log(
  sourceTrace(_[0], opts)
    .map(d => d.path)
    .join("\n")
);
