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

/**
 * Test utilities.
 */

'use strict';

var myjs = require('../myjs-0.1-node.js');

/**
 * Returns true if this string starts with the given substring.
 *
 * @param {String} substr the string to compare with.
 * @return {boolean} Does this string start with the given substr?
 */
String.prototype.startsWith = function(substr) {
  if (this.length < substr.length) {
    return false;
  } else {
    return this.substring(0, substr.length) == substr;
  }
};

module.exports.assertEquals = function(a, b) {
  if (a != b) {
    myjs.test.failComparison(a, b);
  }
};

module.exports.assertTrue = function(value) {
  if (value) {
    return;
  } else {
    throw 'assertTrue failed';
  }
};

module.exports.assertFalse = function(value) {
  module.exports.assertTrue(!value);
};

module.exports.failComparison = function(a, b) {
  console.log(a);
  console.log(b);
  throw 'Error: ' + a + ' != ' + b;
};

module.exports.compareLists = function(one, two) {
  if (one === two)
    return true;
  if (Array.isArray(one) != Array.isArray(two))
    return false;
  if (one.length != two.length)
    return false;
  for (var i = 0; i < one.length; i++) {
    var vOne = one[i];
    var vTwo = two[i];
    if (Array.isArray(vOne) && Array.isArray(vTwo)) {
      if (!module.exports.compareLists(vOne, vTwo))
        return false;
    } else if (one[i] != two[i]) {
      return false;
    }
  }
  return true;
};

module.exports.assertListEquals = function(one, two) {
  if (!module.exports.compareLists(one, two)) {
    module.exports.failComparison(module.exports.listToString(one),
      module.exports.listToString(two));
  }
};

module.exports.listToString = function(obj) {
  if (Array.isArray(obj)) {
    return '[' + obj.map(module.exports.listToString).join(', ') + ']';
  } else {
    return String(obj);
  }
};
