# gulp-apply-template

> Apply templates to files.

For each file in the stream, replace the file's contents by rendering a
template, providing the file object as the template's data or context.

Differences from [gulp-wrap](https://www.npmjs.com/packages/gulp-wrap):

* Uses [consolidate.js](https://github.com/tj/consolidate.js) to support
  multiple template engines.
* Uses properties from `file` object itself as template context.
