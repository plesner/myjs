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
 * Adaptor that replaces some of the closure stuff with dummy implementations and
 * wires the raw code up as a node module in such a way that the uncompiled sources
 * can be used directly with node. Quite hacky.
 */

var fs = require('fs');

var myjs = module.exports;
myjs.ast = { };
myjs.tedir = { };
myjs.utils = { };
myjs.test = { };

var goog = {
  provide: function () { },
  require: function () { },
  inherits: function (sub, sup) {
    function Inheriter() {};
    Inheriter.prototype = sup.prototype;
    sub.superClass_ = sup.prototype;
    sub.prototype = new Inheriter();
    sub.prototype.constructor = sub;
  }
};

function hackRequire(name) {
  var source = fs.readFileSync(name, "utf8");
  eval(source);
}

hackRequire("src/utils.js");
hackRequire("src/ast.js");
hackRequire("src/tedir.js");
hackRequire("src/my.js");
hackRequire('src/fragment/program.js');
hackRequire('src/fragment/statement.js');
hackRequire('src/fragment/core.js');
hackRequire('src/fragment/declaration.js');
hackRequire('src/fragment/lefthand.js');
hackRequire('src/fragment/operators.js');
hackRequire('src/fragment/expression.js');
hackRequire("test/framework.js")
hackRequire("test/test.js")
