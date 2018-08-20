# source-trace

Trace all of your dependencies for any type of JavaScript (and supersets - TS / Flow) source files.

* Supports standard ESM, JS, TypeScript and JSX variants.
* Supports Webpack loader-style paths: `!loader1!loader2?query!./path/to/file`.
* Supports query strings: `./path/to/file?query`.

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

// [{ path: '/absolute/path/to/entry/point.js' }]
sourceTrace('./path/to/entry/point.js').then(console.log);
```

## Returned data

The returned data doesn't just return a path. It also returns other information about the path. For example, if you traced a source that used loaders or query strings in the file path. If a path contained stuff like `!loader!another-loader?query!path?another-query`, you'd get:

```js
{
  loaders: [{ path: 'loader', query: 'another-loader' }],
  originalPath: '!loader!another-loader?query!some/file.js?another-query',
  path: 'some/file.js',
  query: 'another-query',
  resolvedFrom: '/path/to/cwd',
  resolvedPath: '/path/to/cwd/some/file.js'
}
```

The purpose of parsing this extra information is, firstly, that it doesn't error if you're using paths that are valid within the JS ecosystem. Secondly, you are able to do whatever you want with that information. You may want to report what loaders are being used in your app, or even manually invoke the loaders using Webpack's [loader-runner](https://github.com/webpack/loader-runner).

## Options

The following options are supported.

### `extensions`

An array of extensions to search for.

### `ignore`

An `array` or `function` that will tell the tracer whether or not it should ignore the current file and all of its dependencies. By default, it looks at the closest `package.json` and will ignore it if the dependency to be traced is a module and not in the list of dependencies.

## Use cases

### Measuring bundle size

This is great for measuring your theoretical bundle size:

```js
const bytes = require('bytes');
const fs = require('fs');
const sourceTrace = require('source-trace');

(async function () {
  const deps = await sourceTrace('./index.js');
  const stats = deps.map(d => fs.statSync(d.path).size);
  const sum = stats.reduce((prev, curr) => prev + curr, 0);
  console.log(bytes(sum));
}());
```

This doesn't measure any transforms that happen to the code that may make it larger, such as those that happen from Babel or Webpack. It simply operates on your source.
