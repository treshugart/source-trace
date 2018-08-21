#!/usr/bin/env node

const { trace } = require("..");
const yargs = require("yargs");
const { _, ...opts } = yargs.argv;

console.log(
  trace(_[0], opts)
    .map(d => d.path)
    .join("\n")
);
