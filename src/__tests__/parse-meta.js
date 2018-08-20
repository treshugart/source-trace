const parseMeta = require("../parse-meta");

test("data", () => {
  expect(parseMeta("module/test.js")).toEqual({
    loaders: [],
    originalPath: "module/test.js",
    path: "module/test.js",
    query: null
  });
  expect(
    parseMeta("!name1?data1!name2?data2=something!./path/test.js?query")
  ).toEqual({
    loaders: [
      { path: "name1", query: "data1" },
      { path: "name2", query: "data2=something" }
    ],
    originalPath: "!name1?data1!name2?data2=something!./path/test.js?query",
    path: "./path/test.js",
    query: "query"
  });
});
