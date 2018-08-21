const path = require("path");
const { trace } = require("..");

const numFiles = 2;

test("schema", async () => {
  const deps = await trace("!loader?query!./src?query");
  expect(deps).toMatchObject([
    {
      loaders: [],
      originalPath: "./parse-meta",
      path: `./parse-meta`,
      parents: [path.join(process.cwd(), "src", "index.js")],
      query: null,
      resolvedFrom: path.join(process.cwd(), "src"),
      resolvedPath: path.join(process.cwd(), "src", "parse-meta.js")
    },
    {
      loaders: [{ path: "loader", query: "query" }],
      originalPath: "!loader?query!./src?query",
      parents: [],
      path: `./src`,
      query: "query",
      resolvedFrom: process.cwd(),
      resolvedPath: path.join(process.cwd(), "src", "index.js")
    }
  ]);
});

test("ignore default", async () => {
  const deps = await trace("./src");
  expect(deps.length).toBe(numFiles);
});

test("ignore everything", async () => {
  const deps = await trace("./src", { ignore: () => true });
  expect(deps.length).toBe(0);
});

test("project", async () => {
  const deps = await trace("./src/__fixtures__");
  expect(deps.length).toBe(4);
  expect(deps[0].parents.length).toBe(2);
});
