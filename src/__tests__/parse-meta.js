const parseMeta = require("../parse-meta");

test("data", () => {
  expect(parseMeta("module/test.js")).toEqual({
    meta: [],
    path: "module/test.js"
  });
  expect(
    parseMeta("!name1?data1!name2?data2=something!./path/test.js")
  ).toEqual({
    meta: [
      { name: "name1", data: { data1: "" } },
      { name: "name2", data: { data2: "something" } }
    ],
    path: "./path/test.js"
  });
});
