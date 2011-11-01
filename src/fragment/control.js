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

myjs.ast.ReturnStatement = function(argument) {
  this.type = 'ReturnStatement';
  this.argument = argument;
};

myjs.ast.IfStatement = function(test, consequent, opt_alternate) {
  this.type = 'IfStatement';
  this.test = test;
  this.consequent = consequent;
  this.alternate = opt_alternate || null;
};

myjs.ast.LabeledStatement = function(label, body) {
  this.type = 'LabeledStatement';
  this.label = label;
  this.body = body;
};

myjs.ast.BreakStatement = function(label) {
  this.type = 'BreakStatement';
  this.label = label;
};

myjs.ast.ContinueStatement = function(label) {
  this.type = 'ContinueStatement';
  this.label = label;
};

(function () {

  function ReturnStatementHandler() { }

  ReturnStatementHandler.prototype.unparse = function(context, ast) {
    context.write('return');
    if (ast.argument) {
      context.write(' ').node(ast.argument);
    }
    context.write(';').newline();
  };

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <Statement>
    //   -> <IfStatement>
    //   -> <ReturnStatement>
    //   -> <BreakStatement>
    //   -> <ContinueStatement>
    syntax.getRule('Statement')
      .addProd(f.nonterm('IfStatement'))
      .addProd(f.nonterm('ReturnStatement'))
      .addProd(f.nonterm('BreakStatement'))
      .addProd(f.nonterm('ContinueStatement'));

    // <ReturnStatement>
    //   -> "return" <Expression>? ";"
    syntax.getRule('ReturnStatement')
      .addProd(f.keyword('return'), f.option(f.nonterm('Expression')),
        f.punct(';'))
      .setConstructor(myjs.ast.ReturnStatement);

    // <BreakStatement>
    //   -> "break" <Identifier>? ";"
    syntax.getRule('BreakStatement')
      .addProd(f.keyword('break'), f.option(f.nonterm('Identifier')),
        f.punct(';'))
      .setConstructor(myjs.ast.BreakStatement);

    // <ContinueStatement>
    //   -> "continue" <Identifier>? ";"
    syntax.getRule('ContinueStatement')
      .addProd(f.keyword('continue'), f.option(f.nonterm('Identifier')),
        f.punct(';'))
      .setConstructor(myjs.ast.ContinueStatement);

    // <IfStatement>
    //   -> "if" "(" <Expression> ")" <Statement> ("else" <Statement>)?
    syntax.getRule('IfStatement')
      .addProd(f.keyword('if'), f.punct('('), f.nonterm('Expression'),
        f.punct(')'), f.nonterm('Statement'), f.option(f.keyword('else'),
        f.nonterm('Statement')))
      .setConstructor(myjs.ast.IfStatement);

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Control')
    .setSyntaxProvider(getSyntax)
    .addNodeHandler('ReturnStatement', new ReturnStatementHandler());

  myjs.registerFragment(fragment);

})();
