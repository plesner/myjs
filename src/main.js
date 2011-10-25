// Copyright 2011 the MyJs project authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var fs = require('fs');
var myjs = require('./c9');

/**
 * All the files to test the parser on.
 */
var FILES = [
  ['src/utils.js'],
  ['src/ast.js'],
  ['src/tedir.js'],
  ['src/my.js'],
  ['src/mimetype.js'],
  ['test/test.js'],
  ['test/framework.js'],
  ['src/main.js'],
  ['src/dialects/tedir.my.js']
];

/**
 * Invokes the given callback passing in the first of the given values and a
 * function that will invoke the callback with next value. Allows you to
 * asynchronously iterate an array.
 */
function forEachAsync(values, callback, finallyOpt, indexOpt) {
  var index = indexOpt || 0;
  if (index == values.length) {
    return finallyOpt ? finallyOpt() : null;
  } else {
    callback(values[index], function() {
      forEachAsync(values, callback, finallyOpt, index + 1);
    });
  }
}

/**
 * Parses all the source files.
 */
function parseAllFiles() {
  forEachAsync(FILES, function(pair, doNext) {
    var name = pair[0];
    var dialect = myjs.getDialect(pair[1] || 'default');
    fs.readFile(name, 'utf8', function(error, source) {
      var origin = new myjs.tedir.SourceOrigin(name);
      dialect.parseSource(source, origin);
      console.log('Successfully parsed ' + name);
      doNext();
    });
  }, function() {
    console.log('All tests completed successfully.');
  });
}

function Runner(args) {
  this.args = args;
}

Runner.prototype.printUsage = function() {
  console.log('Usage: main.js test');
};

Runner.prototype.start = function() {
  if (this.args.length == 0) {
    return this.printUsage();
  }
  this[this.args[0] + 'Handler'].apply(this, this.args.slice(1));
};

/**
 * Runs all the node-based tests.
 */
Runner.prototype.testHandler = function() {
  parseAllFiles();
};

function strip(text) {
  return text;
}

/**
 * Compiles a list of source files into a single file.
 */
Runner.prototype.compileHandler = function() {
  var files = myjs.utils.toArray(arguments);
  var joined = '';
  forEachAsync(files, function(file, doNext) {
    fs.readFile(file, 'utf8', function(error, source) {
      joined += source;
      doNext();
    });
  }, function() {
    console.log(strip(joined));
  });
};

(new Runner(process.argv.slice(2))).start();
