const path = require("path");
const precinct = require("precinct");
const parseMeta = require("./parse-meta");
const resolve = require("./resolve");

const defs = {
  basedir: process.cwd(),
  cwd: process.cwd(),
  depth: Infinity,
  extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".d.ts"],
  ignore: () => false,
  ignoreNodeModules: true,
  mains: ["src", "module", "main", "types"],
  parent: null,
  resolve: (file) => file,
};

function dependencies(file) {
  // Precinct uses the typescript-eslint-parser and it emits a warning if used
  // on a TS source version that isn't explicitly supported by them. For that
  // reason, we have to suppress logging by it.
  const oldConsoleLog = console.log;
  console.log = () => {};
  const deps = precinct.paperwork(file, {
    includeCore: false,
  });
  console.log = oldConsoleLog;
  return deps;
}

const circularCache = {};
const traceCache = {};
async function trace(files, opts, stack = [], depth = 0) {
  opts = { ...defs, ...opts };

  if (depth > opts.depth) {
    return [];
  }

  const traced = await Promise.all(
    files.map(async (spec) => {
      const meta = parseMeta(spec);
      const file = await resolve(meta, opts);

      if (!file) {
        return;
      }

      if (opts.ignoreNodeModules && file.includes("/node_modules/")) {
        return;
      }

      if (stack.includes(file)) {
        circularCache[file] = true;
      }

      const isTraced = !!traceCache[file];
      traceCache[file] = true;

      return {
        get children() {
          if (!this._children) {
            this._children = trace(
              this.dependencies,
              {
                ...opts,
                basedir: path.dirname(file),
                parent: this,
              },
              stack.concat(file),
              depth + 1
            );
          }
          return this._children;
        },
        get index() {
          return this.siblings?.then((c) => c.indexOf(this));
        },
        get nextSibling() {
          return this.index?.then((i) => this.siblings?.then((s) => s[i + 1]));
        },
        get previousSibling() {
          return this.index?.then((i) => this.siblings?.then((s) => s[i - 1]));
        },
        get siblings() {
          return this.parent?.children;
        },
        absolutePath: file,
        basedir: opts.basedir,
        dependencies: dependencies(file),
        depth,
        isCircular: !!circularCache[file],
        isTraced,
        meta,
        parent: opts.parent,
        relativePath: path.relative(opts.cwd, file),
        relativePathFromParent: opts.parent
          ? path.relative(path.dirname(opts.parent.absolutePath), file)
          : path.relative(opts.cwd, file),
        stack,
      };
    })
  );

  return traced.filter(Boolean);
}

async function traverse(traced, call) {
  const stack = traced;
  while (stack.length) {
    const cur = stack.shift();
    const next = await call(cur);
    if (next === true) {
      stack.unshift(...(await cur.children));
    }
  }
}

async function print(ln, { depth, nextSibling = null, children = [] }) {
  const connector = (await nextSibling) || (await children).length ? "├" : "└";
  const tree = depth ? `${"│".repeat(depth - 1)}${connector}─` : "";
  console.log(`${tree} ${ln}`.trim());
}

module.exports = {
  dependencies,
  print,
  trace,
  traverse,
};
