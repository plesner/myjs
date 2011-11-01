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
 * @fileoverview Basic non-looping control structures.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

myjs.ast.WhileStatement = function(test, body) {
  this.type = 'WhileStatement';
  this.test = test;
  this.body = body;
};

myjs.ast.DoWhileStatement = function(body, test) {
  this.type = 'DoWhileStatement';
  this.body = body;
  this.test = test;
};

myjs.ast.ForStatement = function(init, test, update, body) {
  this.type = 'ForStatement';
  this.init = init;
  this.test = test;
  this.update = update;
  this.body = body;
};

myjs.ast.ForInStatement = function(left, right, body) {
  this.type = 'ForInStatement';
  this.left = left;
  this.right = right;
  this.body = body;
};

(function () {

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <Statement>
    //   -> <IterationStatement>
    syntax.getRule('Statement')
      .addProd(f.nonterm('IterationStatement'));

    // <IterationStatement>
    //   -> "do" <Statement> "while" "(" <Expression> ")" ";"
    //   -> "while" "(" <Expression> ")" <Statement>
    //   -> "for" "(" "var" <VariableDeclarationList> ";" <Expression>? ";"
    //      <Expression>? ")" <Statement>
    //   -> "for" "(" <Expression>? ";" <Expression>? ";" <Expression>? ")"
    //      <Statement>
    //   -> "for" "(" "var" <VariableDeclaration> "in"  <Expression> ")"
    //      <Statement>
    //   -> "for" "(" <LeftHandSideExpression> "in" <Expression> ")" <Statement>
    syntax.getRule('IterationStatement')
      .addProd(f.keyword('do'), f.nonterm('Statement'), f.keyword('while'),
        f.punct('('), f.nonterm('Expression'), f.punct(')'), f.punct(';'))
      .setConstructor(myjs.ast.DoWhileStatement)
      .addProd(f.keyword('while'), f.punct('('), f.nonterm('Expression'),
        f.punct(')'), f.nonterm('Statement'))
      .setConstructor(myjs.ast.WhileStatement)
      .addProd(f.keyword('for'), f.punct('('), f.keyword('var'),
        f.nonterm('VariableDeclarationList'), f.punct(';'),
        f.option(f.nonterm('Expression')), f.punct(';'),
        f.option(f.nonterm('Expression')), f.punct(')'),
        f.nonterm('Statement'))
      .setConstructor(myjs.ast.ForStatement)
      .addProd(f.keyword('for'), f.punct('('),
        f.option(f.nonterm('Expression')), f.punct(';'),
        f.option(f.nonterm('Expression')), f.punct(';'),
        f.option(f.nonterm('Expression')), f.punct(')'),
        f.nonterm('Statement'))
      .setConstructor(myjs.ast.ForStatement)
      .addProd(f.keyword('for'), f.punct('('), f.keyword('var'),
        f.nonterm('VariableDeclaration'), f.keyword('in'),
        f.nonterm('Expression'), f.punct(')'), f.nonterm('Statement'))
      .setConstructor(myjs.ast.ForInStatement)
      .addProd(f.keyword('for'), f.punct('('),
        f.nonterm('LeftHandSideExpression'), f.keyword('in'),
        f.nonterm('Expression'), f.punct(')'), f.nonterm('Statement'))
      .setConstructor(myjs.ast.ForInStatement);

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Iteration')
    .setSyntaxProvider(getSyntax);

  myjs.registerFragment(fragment);

})();
