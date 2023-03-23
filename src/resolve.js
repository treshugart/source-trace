const nodeResolve = require("resolve");

const cache = {};

module.exports = async (meta, opts) => {
  const key = meta.file + opts.basedir;

  if (cache[key]) {
    return cache[key];
  }

  if (await opts.ignore(meta, opts)) {
    return;
  }

  try {
    cache[key] = nodeResolve.sync(await opts.resolve(meta, opts), {
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
