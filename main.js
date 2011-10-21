"use strict";

var fs = require('fs');
var myjs = require('./my');
require('./test/tedir.my.js');

var FILES = [
  ["utils.js"],
  ["ast.js"],
  ["tedir.js"],
  ["my.js"],
  ["mimetype.js"],
  ["test/test.js"],
  ["test/framework.js"],
  ["main.js"],
  ["test/tedir.my.js"],
  ["test/classes.my.js", "tedir/grammar"]
];

/**
 * Invokes the given callback passing in the first of the given values and a
 * function that will invoke the callback with next value. Allows you to
 * asynchronously iterate an array.
 */
function forEachAsync(values, callback, indexOpt) {
  var index = indexOpt || 0;
  if (index == values.length) {
    return;
  } else {
    callback(values[index], function () {
      forEachAsync(values, callback, index + 1);
    });
  }
}

function parseAllFiles() {
  forEachAsync(FILES, function (pair, doNext) {
    var name = pair[0];
    var dialect = myjs.getDialect(pair[1] || "default");
    fs.readFile(name, "utf8", function (error, source) {
      var origin = new myjs.SourceOrigin(name);
      console.log(dialect.parseSource(source, origin));
      doNext();
    });
  });
}

function main() {
  parseAllFiles();
}

main();
