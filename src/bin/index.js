const { trace } = require("..");
const yargs = require("yargs");
const { _, ...opts } = yargs.argv;

(async () => {
  const traced = await trace(_[0], opts);
  console.log(traced.map(d => d.path).join("\n"));
})();
