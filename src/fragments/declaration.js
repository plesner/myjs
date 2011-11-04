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

/**
 * A function declaration.
 *
 * @param {myjs.ast.Identifier} id the name of the function.
 * @param {Array.<myjs.ast.Identifier>} params the function's parameters.
 * @param {myjs.ast.BlockStatement} body the body of the function.
 * @constructor
 * @extends myjs.ast.Declaration
 */
myjs.ast.FunctionDeclaration = function(id, params, body) {
  this['type'] = 'FunctionDeclaration';
  this['id'] = id;
  this['params'] = params;
  this['body'] = body;
};

/**
 * @inheritDoc
 */
myjs.ast.FunctionDeclaration.prototype.unparse = function(context) {
  context.write('function ').node(this['id']).write('(')
    .nodes(this['params'], ', ') .write(')').node(this['body']).newline();
};

/**
 * A variable declaration.
 *
 * @param {Array.<myjs.ast.VariableDeclarator>} declarations the variables
 *   being declared.
 * @constructor
 * @extends myjs.ast.Declaration
 */
myjs.ast.VariableDeclaration = function(declarations) {
  this['type'] = 'VariableDeclaration';
  this['declarations'] = declarations;
};

/**
 * @inheritDoc
 */
myjs.ast.VariableDeclaration.prototype.unparse = function(context) {
  context.write('var ').nodes(this['declarations'], ', ').write(';').newline();
};

/**
 * A single variable declarator.
 *
 * @param {myjs.ast.Identifier} id the identifier being declared.
 * @param {?myjs.ast.Expression} init the value if there is one.
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.VariableDeclarator = function(id, init) {
  this['type'] = 'VariableDeclarator';
  this['id'] = id;
  this['init'] = init;
};

/**
 * @inheritDoc
 */
myjs.ast.VariableDeclarator.prototype.unparse = function(context) {
  context.node(this['id']);
  if (this['init']) {
    context.write(' = ').node(this['init']);
  }
};

(function() {

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
    .registerType('VariableDeclaration', myjs.ast.VariableDeclaration)
    .registerType('VariableDeclarator', myjs.ast.VariableDeclarator)
    .registerType('FunctionDeclaration', myjs.ast.FunctionDeclaration);

  myjs.registerFragment(fragment);

})();
