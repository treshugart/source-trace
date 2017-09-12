const trace = require('../src');

test('all dependencies', async () => {
  const deps = await trace('./src/index.js');
  expect(deps.length).toBeGreaterThan(1);
});

test('local dependencies', async () => {
  const deps = await trace('./src/index.js', {
    ignore(file) {
      const pkg = require('../package.json');
      return pkg.dependencies[file];
    }
  });
  expect(deps.length).toEqual(1);
});
