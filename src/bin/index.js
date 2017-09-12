#!/usr/bin/env node

const sourceTrace = require('..');
const yargs = require('yargs');
const { _, ...opts } = yargs.argv;

sourceTrace(_[0], opts)
  .then(r => r.join('\n'))
  .then(console.log);
