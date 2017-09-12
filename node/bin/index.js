#!/usr/bin/env node
"use strict";

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const sourceTrace = require("..");
const yargs = require("yargs");
var _yargs$argv = yargs.argv;

const _ = _yargs$argv._,
      opts = _objectWithoutProperties(_yargs$argv, ["_"]);

sourceTrace(_[0], opts).then(r => r.join("\n")).then(console.log);