const trace = require(".");

test("should trace non-dependencies", async () => {
  const deps = await trace("./index.js");
  expect(deps.length).toBeGreaterThan(1);
});

test("should trace all dependencies", async () => {
  const deps = await trace("./index.js", {
    ignore(file) {
      const pkg = require("./package.json");
      return pkg.dependencies[file];
    }
  });
  expect(deps.length).toEqual(1);
});
