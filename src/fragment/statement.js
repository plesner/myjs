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
 * @fileoverview Simple basic statements.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

myjs.ast.ExpressionStatement = function(expression) {
  this.type = 'ExpressionStatement';
  this.expression = expression;
};

myjs.ast.BlockStatement = function(body) {
  this.type = 'BlockStatement';
  this.body = body;
};

(function () {

  function ExpressionStatementHandler() { }

  ExpressionStatementHandler.prototype.unparse = function(context, ast) {
    context.node(ast.expression).write(";").newline();
  };

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <Statement>
    //   -> <ExpressionStatement>
    //   -> <Block>
    //   -> <VariableStatement>
    syntax.getRule('Statement')
      .addProd(f.nonterm('ExpressionStatement'))
      .addProd(f.nonterm('Block'))
      .addProd(f.nonterm('VariableStatement'));

    // <ExpressionStatement>
    //   -> <Expression> ";"
    syntax.getRule('ExpressionStatement')
      .addProd(f.nonterm('Expression'), f.punct(';'))
      .setConstructor(myjs.ast.ExpressionStatement);

    // <Block>
    //   -> "{" <Statement>* "}"
    syntax.getRule('Block')
      .addProd(f.punct('{'), f.star(f.nonterm('Statement')), f.punct('}'))
      .setConstructor(myjs.ast.BlockStatement);

    // <VariableStatement>
    //   -> "var" <VariableDeclarationList> ";"
    syntax.getRule('VariableStatement')
      .addProd(f.keyword('var'), f.nonterm('VariableDeclarationList'),
        f.punct(';'));

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Statement')
    .setSyntaxProvider(getSyntax)
    .addNodeHandler('ExpressionStatement', new ExpressionStatementHandler());

  myjs.registerFragment(fragment);

})();
