const nodeResolve = require("resolve");

const cache = {};

module.exports = async function resolve(meta, opts) {
  const key = meta.file + opts.basedir;

  if (cache[key]) {
    return cache[key];
  }

  const file = await opts.resolve(meta, opts);

  if (!file) {
    return;
  }

  try {
    cache[key] = nodeResolve.sync(file, {
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
      `Could not resolve ${meta.file} from ${opts.parent || opts.basedir}`
    );
  }

  return cache[key];
};
