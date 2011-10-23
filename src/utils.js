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

goog.provide('myjs.utils');

/**
 * Converts any array-like object (including arguments objects) to a proper
 * array.
 */
myjs.utils.toArray = function(args) {
  return Array.prototype.slice.call(args);
};

myjs.utils.base = function(me) {
  return me.constructor.superClass_.constructor;
};
