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
 * @fileoverview All declarations.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

myjs.ast.FunctionDeclaration = function(id, params, body) {
  this.type = 'FunctionDeclaration';
  this.id = id;
  this.params = params;
  this.body = body;
};

myjs.ast.VariableDeclaration = function(declarations) {
  this.type = 'VariableDeclaration';
  this.declarations = declarations;
};

myjs.ast.VariableDeclarator = function(id, init) {
  this.type = 'VariableDeclarator';
  this.id = id;
  this.init = init;
};

(function () {

  function VariableDeclarationHandler() { }

  VariableDeclarationHandler.prototype.unparse = function(context, ast) {
    context.write("var ").nodes(ast.declarations, ", ").write(";").newline();
  };

  function FunctionDeclarationHandler() { }

  FunctionDeclarationHandler.prototype.unparse = function(context, ast) {
    context.write("function ").node(ast.id).write("(").nodes(ast.params, ", ")
      .write(")").node(ast.body).newline();
  };

  function VariableDeclaratorHandler() { }

  VariableDeclaratorHandler.prototype.unparse = function(context, ast) {
    context.node(ast.id);
    if (ast.init) {
      context.write(" = ").node(ast.init);
    }
  };

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <VariableDeclarationList>
    //   -> <VariableDeclaration> +: ","
    syntax.getRule('VariableDeclarationList')
      .addProd(f.plus(f.nonterm('VariableDeclaration'), f.punct(',')))
      .setConstructor(myjs.ast.VariableDeclaration);

    // <VariableDeclaration>
    //   -> <Identifier> ("=" <AssignmentExpression>)?
    syntax.getRule('VariableDeclaration')
      .addProd(f.nonterm('Identifier'), f.option(f.punct('='),
        f.nonterm('AssignmentExpression')))
      .setConstructor(myjs.ast.VariableDeclarator);

    // <FunctionDeclaration>
    //   -> "function" <Identifier> "(" <FormalParameterList> ")" "{"
    //      <FunctionBody> "}"
    syntax.getRule('FunctionDeclaration')
      .addProd(f.keyword('function'), f.nonterm('Identifier'), f.punct('('),
        f.nonterm('FormalParameterList'), f.punct(')'), f.punct('{'),
        f.nonterm('FunctionBody'), f.punct('}'))
      .setConstructor(myjs.ast.FunctionDeclaration);

    // <FormalParameterList>
    //   -> <Identifier> *: ","
    syntax.getRule('FormalParameterList')
      .addProd(f.star(f.nonterm('Identifier'), f.punct(',')));

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Declaration')
    .setSyntaxProvider(getSyntax)
    .addNodeHandler('VariableDeclaration', new VariableDeclarationHandler())
    .addNodeHandler('VariableDeclarator', new VariableDeclaratorHandler())
    .addNodeHandler('FunctionDeclaration', new FunctionDeclarationHandler());

  myjs.registerFragment(fragment);

})();
