"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const findRoot = require("find-root");
const fs = require("fs");
const path = require("path");
const precinct = require("precinct");
const resolve = require("resolve");
const util = require("util");

var _map = [fs.readFile, fs.stat].map(util.promisify),
    _map2 = _slicedToArray(_map, 2);

const asyncReadFile = _map2[0],
      asyncStat = _map2[1];

const conf = {
  basedir: null,
  ignore: isDependency,
  extensions: [".js", ".jsx", ".ts", ".tsx"]
};

function isAmdName(file) {
  return file === "exports" || file === "moudle";
}

function isDependency(file, opts) {
  if (!isModule(file)) {
    return false;
  }
  const root = findRoot(opts.basedir);
  if (root) {
    var _require = require(`${root}/package.json`);

    const dependencies = _require.dependencies;

    return dependencies && !dependencies[file];
  }
}

function isModule(file) {
  var _file = _slicedToArray(file, 1);

  const first = _file[0];

  return first !== "." && first !== "/";
}

module.exports = (() => {
  var _ref = _asyncToGenerator(function* (file, opts) {
    // Ignore special AMD names.
    if (isAmdName(file)) {
      return [];
    }

    opts = _extends({}, conf, opts);

    if (!opts.basedir) {
      opts.basedir = path.dirname(file);
      file = `./${path.basename(file)}`;
    }

    // So the instance isn't shared.
    if (!opts.visited) {
      opts.visited = {};
    }

    if (opts.ignore) {
      if (typeof opts.ignore === "function" && opts.ignore(file, opts) || opts.ignore.indexOf && opts.ignore.indexOf(file) > -1) {
        return [];
      }
    }

    const resolved = resolve.sync(file, opts);

    if (opts.visited[resolved] || isModule(resolved)) {
      return [];
    }

    opts.visited[resolved] = true;

    const contents = (yield asyncReadFile(resolved)).toString();
    const immediateDeps = precinct(contents);
    const tracedDeps = [];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = immediateDeps[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        const immediateDep = _step.value;

        tracedDeps.push(...(yield sourceTrace(immediateDep, _extends({}, opts, { basedir: path.dirname(resolved) }))));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    tracedDeps.push(resolved);

    return tracedDeps;
  });

  function sourceTrace(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return sourceTrace;
})();