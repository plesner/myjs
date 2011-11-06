#!/usr/bin/env node
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
var myjs = require('../out/myjs-node.js');
myjs.test = require('../test/test.js');

/**
 * All the files to test the parser on.
 */
var FILES = [
  ['src/utils.js'],
  ['src/ast.js'],
  ['src/tedir.js'],
  ['src/myjs.js'],
  ['src/mimetype.js'],
  ['test/test.js'],
  ['test/framework.js'],
  ['tools/main.js'],
  ['src/fragments/program.js'],
  ['src/fragments/statement.js'],
  ['src/fragments/core.js'],
  ['src/fragments/declaration.js'],
  ['src/fragments/lefthand.js'],
  ['src/fragments/operators.js'],
  ['src/fragments/expression.js'],
  ['src/fragments/control.js'],
  ['src/fragments/iteration.js'],
  ['src/fragments/exceptions.js'],
  ['src/extensions/quote.js']
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
function parseAllFiles(files) {
  var totalTimeMillis = 0;
  var charsProcessed = 0;
  var failed = [];
  forEachAsync(files, function(pair, doNext) {
    var name = pair[0];
    var dialect = myjs.getDialect(pair[1] || 'myjs.JavaScript');
    fs.readFile(name, 'utf8', function(error, rawSource) {
      console.log(name);
      // Strip any hashbangs.
      var source = rawSource.replace(/^\#\!.*/, '');
      var origin = new myjs.tedir.SourceOrigin(name);
      var now = new Date();
      try {
        dialect.translate(source, origin);
      } catch (e) {
        failed.push(name);
      }
      var duration = new Date() - now;
      totalTimeMillis += duration;
      charsProcessed += source.length;
      console.log("Parsed " + name + " [" + duration + " ms.]");
      doNext();
    });
  }, function() {
    if (failed.size == 0) {
      console.log('All files parsed successfully.');
      var megas = charsProcessed / (1024 * 1024);
      var megasPerMilli = megas / totalTimeMillis;
      var megasPerSec = megasPerMilli * 1000;
      console.log('Throughput: ' + megasPerSec.toPrecision(4) + " M/s");
    } else {
      console.log('Tests failed:');
      console.log(failed.map(function(name) { return "  '" + name + "': true,"; }).join("\n"));
    }
  });
}

function runUnitTests() {
  var tests = myjs.test.getAllTests();
  tests.forEach(function (test) {
    console.log("Running " + test.name);
    test();
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
  parseAllFiles(FILES);
  runUnitTests();
};

function matchFilter(regexp, negate) {
  return function(file) {
    return negate ^ regexp.test(file);
  };
}

/**
 * Invoke the callback with a list of all the files in the given
 * directory.
 */
Runner.prototype.listFiles = function(root, callback, partial) {
  var self = this;
  var result = partial || [];
  fs.readdir(root, function(readdirErr, files) {
    var nonHidden = files.filter(matchFilter(/^\./, true));
    forEachAsync(nonHidden, function(file, doNext) {
      var fullPath = root + "/" + file;
      fs.stat(fullPath, function(statErr, stats) {
        if (stats.isDirectory()) {
          self.listFiles(fullPath, doNext, result);
        } else {
          result.push(fullPath);
          doNext();
        }
      });
    }, function() {
      callback(result);
    });
  });
};

var benchBlacklist = {
  'download/library/closure/goog/format/format.js': true,
  'download/library/closure/goog/gears/database.js': true,
  'download/library/closure/goog/i18n/bidi.js': true,
  'download/library/closure/goog/i18n/numberformat.js': true,
  'download/library/closure/goog/math/bezier.js': true,
  'download/library/closure/goog/net/filedownloader.js': true,
  'download/library/closure/goog/storage/mechanism/ieuserdata.js': true,
  'download/library/closure/goog/string/string.js': true,
  'download/library/closure/goog/testing/fs/entry.js': true,
  'download/library/closure/goog/testing/performancetable.js': true,
  'download/library/closure/goog/testing/stacktrace.js': true,
  'download/library/closure/goog/uri/uri.js': true,
  'download/library/closure/goog/vec/vec.js': true,
  'download/library/closure/goog/window/window.js': true,
  'download/library/third_party/closure/goog/caja/string/html/htmlparser.js': true
};

/**
 * Parse all files in the closure library.
 */
Runner.prototype.benchHandler = function() {
  this.listFiles("download/library", function(files) {
    var jses = files.filter(matchFilter(/\.js$/));
    var whitelist = jses.filter(function(elm) { return !benchBlacklist[elm]; });
    var pairs = whitelist.map(function(elm) { return [elm]; });
    parseAllFiles(pairs);
  });
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
