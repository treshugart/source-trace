const findRoot = require("find-root");
const fs = require("fs-extra");
const path = require("path");
const precinct = require("precinct");
const resolve = require("resolve");
const parseMeta = require("./parse-meta");

const defs = {
  basedir: null,
  extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx"],
  ignore({ path }) {
    return isAmdName(path) || isModuleName(path);
  },
  parent: null
};

function getDependencyPaths(file) {
  // Precinct uses the typescript-eslint-parser and it emits a wanring if used
  // on a TS source version that isn't explicitly supported by them. For that
  // reason, we have to suppress logging by it.
  const oldConsoleLog = console.log;
  console.log = () => {};
  const deps = precinct.paperwork(file);
  console.log = oldConsoleLog;
  return deps;
}

function isAmdName(file) {
  return file === "exports" || file === "module";
}

function isModuleName(file) {
  const [first] = file;
  return first !== "." && first !== "/" && !file.match(/^[a-zA-Z]:/);
}

async function trace(file, opts) {
  opts = { ...defs, basedir: process.cwd(), visited: {}, ...opts };
  const meta = parseMeta(file);
  file = meta.path;

  // Ignore check.
  if (opts.ignore(meta)) {
    return [];
  }

  const resolved = resolve.sync(file, {
    basedir: opts.basedir,
    extensions: opts.extensions
  });
  const traced = [];

  // Depth-first means children come first.
  for (const immediateDep of getDependencyPaths(resolved)) {
    traced.push(
      ...(await trace(immediateDep.replace(/\.js$/, ""), {
        ...opts,
        ...{
          basedir: path.dirname(resolved),
          parent: resolved
        }
      }))
    );
  }

  // Depth-first means parent comes after the children.
  //
  // We also record the visited files so we have a pointer back to them in case
  // we need to update its metadata later on.
  if (opts.visited[resolved]) {
    opts.visited[resolved].parents.push(opts.parent);
  } else {
    opts.visited[resolved] = {
      ...meta,
      parents: opts.parent ? [opts.parent] : [],
      path: file,
      resolvedFrom: opts.basedir,
      resolvedPath: resolved,
      suffix: resolved.split(".").pop()
    };
    traced.push(opts.visited[resolved]);
  }

  return traced;
}

module.exports = {
  isAmdName,
  isModuleName,
  getDependencyPaths,
  trace
};
