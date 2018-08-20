const findRoot = require("find-root");
const fs = require("fs-extra");
const path = require("path");
const precinct = require("precinct");
const resolve = require("resolve");
const parseMeta = require("./parse-meta");

const conf = {
  basedir: null,
  ignore: isModule,
  extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx"]
};

function getDeps(file) {
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

function isModule(file) {
  const [first] = file;
  return first !== "." && first !== "/" && !file.match(/^[a-zA-Z]:/);
}

async function stats(path) {
  try {
    return await fs.stat(path);
  } catch (e) {
    return null;
  }
}

module.exports = async function sourceTrace(file, opts) {
  opts = { ...conf, ...opts };
  const resolved = resolve.sync(file, {
    basedir: opts.basedir,
    extensions: opts.extensions
  });
  const meta = parseMeta(resolved);
  file = meta.path;

  // Ignore special AMD names.
  if (isAmdName(file)) {
    return [];
  }

  if (!opts.basedir) {
    opts.basedir = path.resolve(path.dirname(file));
    file = `./${path.basename(file)}`;
  }

  // So the instance isn't shared.
  if (!opts.visited) {
    opts.visited = {};
  }

  if (opts.ignore) {
    if (
      (typeof opts.ignore === "function" && opts.ignore(file, opts)) ||
      (opts.ignore.indexOf && opts.ignore.indexOf(file) > -1)
    ) {
      return [];
    }
  }

  if (opts.visited[resolved] || isModule(resolved)) {
    return [];
  }

  opts.visited[resolved] = true;

  const immediateDeps = getDeps(resolved);
  const tracedDeps = [];

  // Depth-first means children come first.
  for (const immediateDep of immediateDeps) {
    const childDeps = await sourceTrace(immediateDep.replace(/\.js$/, ""), {
      ...opts,
      ...{ basedir: path.dirname(resolved) }
    });
    tracedDeps.push(...childDeps.map(d => ({ ...d, parent: resolved })));
  }

  // Depth-first means parent comes after the children.
  tracedDeps.push({
    ...meta,
    parent: null,
    path: file,
    resolvedFrom: opts.basedir,
    resolvedPath: resolved
  });

  return tracedDeps;
};
