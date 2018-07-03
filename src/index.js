const findRoot = require("find-root");
const fs = require("fs");
const path = require("path");
const precinct = require("precinct");
const resolve = require("resolve");

const conf = {
  basedir: null,
  ignore: isModule,
  extensions: [".js", ".json", ".jsx", ".ts", ".tsx"]
};

function isAmdName(file) {
  return file === "exports" || file === "module";
}

function isModule(file) {
  const [first] = file;
  return first !== "." && first !== "/";
}

module.exports = function sourceTrace(file, opts) {
  // Ignore special AMD names.
  if (isAmdName(file)) {
    return [];
  }

  opts = { ...conf, ...opts };

  if (!opts.basedir) {
    opts.basedir = path.dirname(file);
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
      })
    );
  }

  tracedDeps.push(resolved);

  return tracedDeps;
};
