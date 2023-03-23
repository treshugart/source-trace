const path = require("path");
const dependencies = require("./dependencies");
const parseMeta = require("./parseMeta");
const resolve = require("./resolve");

const defs = {
  basedir: process.cwd(),
  cwd: process.cwd(),
  depth: Infinity,
  extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".d.ts"],
  ignore: ({ absolutePath }) => absolutePath.includes("/node_modules/"),
  ignoreNodeModules: true,
  mains: ["src", "module", "main", "types"],
  parent: null,
  resolve: (file) => file,
};

const circularCache = {};
const traceCache = {};

module.exports = async function trace(files, opts, stack = [], depth = 0) {
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

      if (stack.includes(file)) {
        circularCache[file] = true;
      }

      const isTraced = !!traceCache[file];
      traceCache[file] = true;
      const fileObj = {
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

      if (opts.ignore(fileObj, opts)) {
        return;
      }

      return fileObj;
    })
  );

  return traced.filter(Boolean);
};
