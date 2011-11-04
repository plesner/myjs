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
 * @fileoverview Test utilities.
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

/**
 * Fails if the two arguments are not equal.
 *
 * @param {*} a first value.
 * @param {*} b second value.
 */
module.exports.assertEquals = function(a, b) {
  if (a != b) {
    module.exports.failComparison(a, b);
  }
};

/**
 * Fails the the given value isn't truthy.
 *
 * @param {*} value the value to check.
 */
module.exports.assertTrue = function(value) {
  if (value) {
    return;
  } else {
    throw 'assertTrue failed';
  }
};

/**
 * Fails if the given value isn't falsy.
 *
 * @param {*} value the value to check.
 */
module.exports.assertFalse = function(value) {
  module.exports.assertTrue(!value);
};

/**
 * Prints an error message that a is different from b and then
 * throws an error.
 *
 * @param {*} a the first value.
 * @param {*} b the second value.
 */
module.exports.failComparison = function(a, b) {
  console.log(a);
  console.log(b);
  throw 'Error: ' + a + ' != ' + b;
};

/**
 * Compares two lists recursively.
 *
 * @param {Array} one the first array.
 * @param {Array} two the second array.
 * @return {boolean} true iff the two arrays are equal, recursively.
 */
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

/**
 * Fails if the two given arrays are not recursively equal.
 *
 * @param {Array} one the first list.
 * @param {Array} two the second list.
 */
module.exports.assertListEquals = function(one, two) {
  if (!module.exports.compareLists(one, two)) {
    module.exports.failComparison(module.exports.listToString(one),
      module.exports.listToString(two));
  }
};

/**
 * Converts an array to a string of the form [a, b, b], recursively.
 *
 * @param {*} obj an object to convert.
 * @return {string} a string representation of the object.
 */
module.exports.listToString = function(obj) {
  if (Array.isArray(obj)) {
    return '[' + obj.map(module.exports.listToString).join(', ') + ']';
  } else {
    return String(obj);
  }
};
