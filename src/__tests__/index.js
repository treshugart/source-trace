const trace = require("..");
const numFiles = 2;

test("schema", async () => {
  const deps = await trace("!loader?query!./src?query");
  expect(deps).toMatchObject([
    {
      loaders: [],
      originalPath: "./parse-meta",
      path: `./parse-meta`,
      parent: `${process.cwd()}/src/index.js`,
      query: null,
      resolvedFrom: `${process.cwd()}/src`,
      resolvedPath: `${process.cwd()}/src/parse-meta.js`
    },
    {
      loaders: [{ path: "loader", query: "query" }],
      originalPath: "!loader?query!./src?query",
      parent: null,
      path: `./src`,
      query: "query",
      resolvedFrom: process.cwd(),
      resolvedPath: `${process.cwd()}/src/index.js`
    }
  ]);
});

test("defaults (should ignore deps)", async () => {
  const deps = await trace("./src");
  expect(deps.length).toBe(numFiles);
});

test("ignore everything", async () => {
  const deps = await trace("./src", { ignore: () => true });
  expect(deps.length).toBe(0);
});

test("ignore nothing", async () => {
  const deps = await trace("./src", { ignore: () => false });
  expect(deps.length).toBeGreaterThan(numFiles);
});
