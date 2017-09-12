const findRoot = require('find-root');
const fs = require('fs');
const path = require('path');
const precinct = require('precinct');
const resolve = require('resolve');
const util = require('util');

const [asyncReadFile, asyncStat] = [fs.readFile, fs.stat].map(util.promisify);
const conf = {
  basedir: null,
  ignore: isDependency,
  extensions: ['.js', '.jsx', '.ts', '.tsx']
};

function isAmdName(file) {
  return file === 'exports' || file === 'moudle';
}

function isDependency(file, opts) {
  if (!isModule(file)) {
    return false;
  }
  const root = findRoot(opts.basedir);
  if (root) {
    const { dependencies } = require(`${root}/package.json`);
    return dependencies && !dependencies[file];
  }
}

function isModule(file) {
  const [first] = file;
  return first !== '.' && first !== '/';
}

module.exports = async function sourceTrace(file, opts) {
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
      (typeof opts.ignore === 'function' && opts.ignore(file, opts)) ||
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

  const contents = (await asyncReadFile(resolved)).toString();
  const immediateDeps = precinct(contents);
  const tracedDeps = [];

  for (const immediateDep of immediateDeps) {
    tracedDeps.push(
      ...(await sourceTrace(immediateDep, {
        ...opts,
        ...{ basedir: path.dirname(resolved) }
      }))
    );
  }

  tracedDeps.push(resolved);

  return tracedDeps;
};
