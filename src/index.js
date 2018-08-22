const findRoot = require("find-root");
const fs = require("fs-extra");
const path = require("path");
const precinct = require("precinct");
const resolve = require("resolve");
const parseMeta = require("./parse-meta");

const defs = {
  basedir: null,
  extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx"],
  ignore() {
    return true;
  },
  mains: ["main", "module"],
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

function isModuleName(file) {
  const [first] = file;
  return (
    first === "@" ||
    (first !== "." && first !== "/" && !file.match(/^[a-zA-Z]:/))
  );
}

async function trace(file, opts) {
  opts = { ...defs, basedir: process.cwd(), visited: {}, ...opts };
  const meta = parseMeta(file);
  file = meta.path;

  // Ignore check.
  if (opts.ignore(meta)) {
    return [];
  }

  // Attempt to resolve the path.
  const resolved = resolve.sync(file, {
    basedir: opts.basedir,
    extensions: opts.extensions,
    packageFilter(pkg, dir) {
      return {
        ...pkg,
        main: opts.mains.reduce((prev, next) => {
          return next in pkg ? pkg[next] : prev;
        }, pkg.main)
      };
    }
  });

  // If the path still cannot be resolved, it's a built in.
  if (isModuleName(resolved)) {
    return [];
  }

  // We also record the visited files so we have a pointer back to them in case
  // we need to update its metadata later on.
  if (opts.visited[resolved]) {
    opts.visited[resolved].parents.push(opts.parent);
    return [];
  } else {
    opts.visited[resolved] = {
      ...meta,
      parents: opts.parent ? [opts.parent] : [],
      path: file,
      resolvedFrom: opts.basedir,
      resolvedPath: resolved,
      suffix: resolved.split(".").pop()
    };
  }

  // Depth-first means children come first.
  const traced = [];
  for (const immediateDep of getDependencyPaths(resolved)) {
    const formattedName = isModuleName(immediateDep)
      ? immediateDep
      : immediateDep.replace(/\.js$/, "");
    traced.push(
      ...(await trace(formattedName, {
        ...opts,
        ...{
          basedir: path.dirname(resolved),
          parent: resolved
        }
      }))
    );
  }

  // Depth-first means parent comes after the children.
  traced.push(opts.visited[resolved]);

  return traced;
}

module.exports = {
  isAmdName,
  isModuleName,
  getDependencyPaths,
  trace
};
