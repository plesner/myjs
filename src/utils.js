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

(function() {

function defineUtils(namespace) { // offset: 3

  namespace.toArray = toArray;
  /**
   * Converts any array-like object (including arguments objects) to a proper
   * array.
   */
  function toArray(args) {
    return Array.prototype.slice.call(args);
  }

  namespace.inherits = inherits;
  /**
   * Simple prototype-based inheritance.
   */
  function inherits(sub, sup) {
    function Inheriter() { }
    Inheriter.prototype = sup.prototype;
    sub.prototype = new Inheriter();
    sub.prototype.constructor = sub;
    sub.parent = sup;
  }

  namespace.getSource = function() {
    return String(defineUtils);
  };

  return namespace;

}

if (typeof module == 'undefined') {
  this.utils = this.utils || defineUtils({});
} else {
  defineUtils(module.exports);
}

}).call(this);
