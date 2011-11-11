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
 * @fileoverview With statement.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

/**
 * A while statement.
 *
 * @param {myjs.ast.Expression} object the value.
 * @param {myjs.ast.Statement} body the body statement.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.WithStatement = function(object, body) {
  this['type'] = 'WithStatement';
  this['object'] = object;
  this['body'] = body;
};

/**
 * @inheritDoc
 */
myjs.ast.WithStatement.prototype.unparse = function(context) {
  context.write('with (').node(this['object']).write(') ').node(this['body']);
};

(function() {

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <Statement>
    //   -> <WithStatement>
    syntax.getRule('Statement')
      .addProd(f.nonterm('WithStatement'));

    // <WithStatement>
    //   -> "with" "(" <Expression> ")" <Statement>
    syntax.getRule('WithStatement')
      .addProd(f.keyword('with'), f.punct('('), f.nonterm('Expression'),
        f.punct(')'), f.nonterm('Statement'))
      .setConstructor(myjs.ast.WithStatement);

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.With')
    .setSyntaxProvider(getSyntax)
    .registerType('WithStatement', myjs.ast.WithStatement);

  myjs.registerFragment(fragment);

})();
