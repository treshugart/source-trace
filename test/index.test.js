const trace = require("../src");

function removeCwd(v) {
  return v.replace(process.cwd(), "");
}

test("defaults (should ignore deps)", async () => {
  const deps = await trace("./src/index.js");
  expect(deps.map(removeCwd)).toMatchSnapshot();
});

test("ignore everything", async () => {
  const deps = await trace("./src/index.js", {
    ignore(file) {
      return true;
    }
  });
  expect(deps.map(removeCwd)).toMatchSnapshot();
});

test("ignore nothing", async () => {
  const deps = await trace("./src/index.js", {
    ignore(file) {
      return false;
    }
  });
  expect(deps.map(removeCwd)).toMatchSnapshot();
});
