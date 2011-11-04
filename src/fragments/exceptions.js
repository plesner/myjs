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
 * @fileoverview Exceptions.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

/**
 * A throw statement.
 *
 * @param {myjs.ast.Expression} argument the value to throw.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.ThrowStatement = function(argument) {
  this['type'] = 'ThrowStatement';
  this['argument'] = argument;
};

/**
 * A try/catch/finally statement.
 *
 * @param {myjs.ast.BlockStatement} block the try body.
 * @param {?myjs.ast.CatchClause} handler the catch handler.
 * @param {?myjs.ast.BlockStatement} finalizer the finally clause.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.TryStatement = function(block, handler, finalizer) {
  this['type'] = 'TryStatement';
  this['block'] = block;
  this['handler'] = handler;
  this['finalizer'] = finalizer;
};

/**
 * A catch clause.
 *
 * @param {myjs.ast.Identifier} param the catch parameter.
 * @param {myjs.ast.BlockStatement} body the body of the catch clause.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.CatchClause = function(param, body) {
  this['type'] = 'CatchClause';
  this['param'] = param;
  this['body'] = body;
};

(function() {

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <Statement>
    //   -> <ThrowStatement>
    //   -> <TryStatement>
    syntax.getRule('Statement')
      .addProd(f.nonterm('ThrowStatement'))
      .addProd(f.nonterm('TryStatement'));

    // <ThrowStatement>
    //   -> "throw" <Expression> ";"
    syntax.getRule('ThrowStatement')
      .addProd(f.keyword('throw'), f.nonterm('Expression'), f.punct(';'))
      .setConstructor(myjs.ast.ThrowStatement);

    // <TryStatement>
    //   -> "try" <Block> <Catch>? <Finally>?
    syntax.getRule('TryStatement')
      .addProd(f.keyword('try'), f.nonterm('Block'),
        f.option(f.nonterm('Catch')), f.option(f.nonterm('Finally')))
      .setConstructor(myjs.ast.TryStatement);

    // <Catch>
    //   -> "catch" "(" <Identifier> ")" <Block>
    syntax.getRule('Catch')
      .addProd(f.keyword('catch'), f.punct('('), f.nonterm('Identifier'),
        f.punct(')'), f.nonterm('Block'))
      .setConstructor(myjs.ast.CatchClause);

    // <Finally>
    //   -> "finally" <Block>
    syntax.getRule('Finally')
      .addProd(f.keyword('finally'), f.nonterm('Block'));

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Exceptions')
    .setSyntaxProvider(getSyntax);

  myjs.registerFragment(fragment);

})();
