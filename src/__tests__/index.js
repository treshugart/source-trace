const path = require("path");
const { trace } = require("..");

test("schema", async () => {
  const deps = await trace("!loader?query!./src?query");
  expect(deps).toMatchObject([
    {
      absolutePath:
        "/usr/local/google/home/treshugart/dev/source-trace/src/parse-meta.js",
      loaders: [],
      originalPath: "./parse-meta",
      parents: [
        "/usr/local/google/home/treshugart/dev/source-trace/src/index.js",
      ],
      path: "./parse-meta",
      query: null,
      relativePath: "src/parse-meta.js",
      resolvedFrom: "/usr/local/google/home/treshugart/dev/source-trace/src",
      suffix: "js",
    },
    {
      absolutePath:
        "/usr/local/google/home/treshugart/dev/source-trace/src/index.js",
      loaders: [{ path: "loader", query: "query" }],
      originalPath: "!loader?query!./src?query",
      parents: [],
      path: "./src",
      query: "query",
      relativePath: "src/index.js",
      resolvedFrom: "/usr/local/google/home/treshugart/dev/source-trace",
      suffix: "js",
    },
  ]);
});

test("ignore default", async () => {
  const deps = await trace(".");
  expect(deps.length).toBe(2);
});

test("ignore everything", async () => {
  const deps = await trace(".", { ignore: () => true });
  expect(deps.length).toBe(0);
});

test("project", async () => {
  const deps = await trace("./src/__fixtures__");
  expect(deps.length).toBe(4);
  expect(deps[0].parents.length).toBe(2);
});
