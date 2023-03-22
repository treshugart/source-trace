const path = require("path");
const precinct = require("precinct");
const resolve = require("resolve");
const parseMeta = require("./parse-meta");

const defs = {
  basedir: process.cwd(),
  cwd: process.cwd(),
  extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".d.ts"],
  ignore: () => false,
  ignoreNodeModules: true,
  mains: ["src", "module", "main", "types"],
  parent: "",
  resolve: (file) => file,
};

function list(file) {
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

function isModuleName(file) {
  const [first] = file;
  return (
    first === "@" ||
    (first !== "." && first !== "/" && !file.match(/^[a-zA-Z]:/))
  );
}

async function trace(file, opts, visited = {}) {
  opts = { ...defs, ...opts };
  const meta = parseMeta(file);
  file = meta.path;

  // Ignore check.
  if (await opts.ignore(meta, opts)) {
    return [];
  }

  // Attempt to resolve the path.
  let resolved;
  try {
    resolved = resolve.sync(await opts.resolve(file, opts), {
      basedir: opts.basedir,
      extensions: opts.extensions,
      packageFilter: (pkg) => ({
        ...pkg,
        main: pkg[opts.mains.find((main) => pkg[main])],
      }),
    });
  } catch (e) {
    // This is a more helpful error because node-resolve will tell you the
    // basedir the file was being resolved from, but not the file.
    throw new Error(
      `Could not resolve ${file} from ${opts.parent || opts.basedir}`
    );
  }

  if (opts.ignoreNodeModules && resolved.includes("/node_modules/")) {
    return [];
  }

  // We also record the visited files so we have a pointer back to them in case
  // we need to update its metadata later on.
  if (visited[resolved]) {
    visited[resolved].parents.push(opts.parent);
    return [];
  } else {
    visited[resolved] = {
      ...meta,
      absolutePath: resolved,
      parents: opts.parent ? [opts.parent] : [],
      path: file,
      relativePath: path.relative(opts.cwd, resolved),
      resolvedFrom: opts.basedir,
      suffix: resolved.split(".").pop(),
    };
  }

  // Depth-first means children come first.
  const traced = [];
  for (const immediateDep of list(resolved)) {
    const formattedName = isModuleName(immediateDep)
      ? immediateDep
      : immediateDep.replace(/\.js$/, "");
    traced.push(
      ...(await trace(
        formattedName,
        {
          ...opts,
          ...{
            basedir: path.dirname(resolved),
            parent: resolved,
          },
        },
        visited
      ))
    );
  }

  // Depth-first means parent comes after the children.
  traced.push(visited[resolved]);

  return traced;
}

module.exports = {
  list,
  trace,
};
