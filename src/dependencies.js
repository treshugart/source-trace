const precinct = require("precinct");

module.exports = function dependencies(file) {
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
};
