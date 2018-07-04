const findRoot = require("find-root");
const fs = require("fs");
const path = require("path");
const precinct = require("precinct");
const resolve = require("resolve");
const parseMeta = require("./parse-meta");

const conf = {
  basedir: null,
  ignore: isModule,
  extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx"]
};

function isAmdName(file) {
  return file === "exports" || file === "module";
}

function isModule(file) {
  const [first] = file;
  return first !== "." && first !== "/";
}

module.exports = function sourceTrace(file, opts) {
  const meta = parseMeta(file);
  file = meta.path;

  // Ignore special AMD names.
  if (isAmdName(file)) {
    return [];
  }

  opts = { ...conf, ...opts };

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

  const resolved = resolve.sync(file, opts);

  if (opts.visited[resolved] || isModule(resolved)) {
    return [];
  }

  opts.visited[resolved] = true;

  const contents = fs.readFileSync(resolved).toString();
  const immediateDeps = precinct(contents);
  const tracedDeps = [];

  for (const immediateDep of immediateDeps) {
    tracedDeps.push(
      ...sourceTrace(immediateDep, {
        ...opts,
        ...{ basedir: path.dirname(resolved) }
      }).map(d => ({ ...d, parent: resolved }))
    );
  }

  tracedDeps.push({
    ...meta,
    parent: null,
    path: file,
    resolvedFrom: opts.basedir,
    resolvedPath: resolved
  });

  return tracedDeps;
};
