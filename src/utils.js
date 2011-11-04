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
 * @fileoverview Misc utilities used by myjs.
 */

'use strict';

goog.provide('myjs.utils');

/**
 * Converts any array-like object (including arguments objects) to a proper
 * array.
 *
 * @param {Object} args an array-like object to convert.
 * @param {number=} opt_start index of the first element to include in the
 *   result.
 * @return {Array} an array containing the elements of the given argument.
 */
myjs.utils.toArray = function(args, opt_start) {
  return Array.prototype.slice.call(args, opt_start);
};

/**
 * Returns the parent constructor function for the given object.
 *
 * @param {Object} me the value to extract the constructor from.
 * @return {Function} the parent constructor function.
 */
myjs.utils.base = function(me) {
  return me.constructor.superClass_.constructor;
};

/**
 * Throws an error signalling that an abstract method was called.
 */
myjs.utils.abstractMethodCalled = function() {
  throw new Error('Abstract Method Called');
};
