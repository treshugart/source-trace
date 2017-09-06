# source-trace

Trace all of your dependencies for any type of JavaScript (and supersets - TS / Flow) source files.

## Install

```sh
npm install source-trace
```

## Usage

You can use the `source-trace` command to return a list of dependencies.

```sh
$ source-trace ./path/to/entry/point.js
```

Or in JS:

```js
const sourceTrace = require('source-trace');

sourceTrace('./path/to/entry/point.js').then(console.log);
```

## Options

The following options are supported.

### `extensions`

An array of extensions to search for.

### `ignore`

An `array` or `function` that will tell the tracer whether or not it should ignore the current file and all of its dependencies. By default, it looks at the closest `package.json` and will ignore it if the dependency to be traced is a module and not in the list of dependencies.

## Use cases

This is great for measuring your theoretical bundle size:

```js
const byptes = require('bytes');
const sourceTrace = require('source-trace');

(async function () {
  const deps = await sourceTrace('./index.js');
  const stats = deps.map(d => fs.statSync(d).size);
  const sum = stats.reduce((prev, curr) => prev + curr), 0);
  console.log(bytes(sum));
}());
```

This doesn't measure any transforms that happen to the code that may make it larger, such as those that happen from Babel or Webpack. It simply operates on your source.
