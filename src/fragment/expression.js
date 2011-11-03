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
 * @fileoverview Simple basic expressions.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

/**
 * @constructor
 */
myjs.ast.ThisExpression = function() {
  this.type = 'ThisExpression';
};

myjs.ast.ThisExpression.INSTANCE_ = new myjs.ast.ThisExpression();

myjs.ast.ThisExpression.get = function() {
  return myjs.ast.ThisExpression.INSTANCE_;
};

myjs.ast.ThisExpression.prototype.unparse = function(context) {
  context.write('this');
};

/**
 * @constructor
 */
myjs.ast.ArrayExpression = function(elements) {
  this.type = 'ArrayExpression';
  this.elements = elements;
};

myjs.ast.ArrayExpression.prototype.unparse = function(context) {
  context.write('[').nodes(this.elements, ', ').write(']');
};

/**
 * @constructor
 */
myjs.ast.ObjectExpression = function(properties) {
  this.type = 'ObjectExpression';
  this.properties = properties;
};

/**
 * @constructor
 */
myjs.ast.ObjectProperty = function(key, value) {
  this.key = key;
  this.value = value;
};


/**
 * @constructor
 */
myjs.ast.FunctionExpression = function(id, params, body) {
  this.type = 'FunctionExpression';
  this.id = id;
  this.params = params;
  this.body = body;
};

myjs.ast.FunctionExpression.prototype.unparse = function(context) {
  context.write('function ');
  if (this.id) {
    context.node(this.id);
  }
  context.write('(').nodes(this.params, ', ').write(') ').node(this.body)
    .newline();
};

/**
 * @constructor
 */
myjs.ast.ConditionalExpression = function(test, consequent, alternate) {
  this.type = 'ConditionalExpression';
  this.test = test;
  this.consequent = consequent;
  this.alternate = alternate;
};

myjs.ast.ConditionalExpression.prototype.unparse = function(context) {
  context.write('(').node(this.test).write(')?(').node(this.consequent)
    .write('):(').node(this.alternate).write(')');
};

(function() {

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <PrimaryExpression>
    //   -> "this"
    //   -> <Identifier>
    //   -> <Literal>
    //   -> <ArrayLiteral>
    //   -> <ObjectLiteral>
    //   -> "(" <Expression> ")"
    syntax.getRule('PrimaryExpression')
      .addProd(f.keyword('this'))
      .setHandler(myjs.ast.ThisExpression.get)
      .addProd(f.nonterm('Identifier'))
      .addProd(f.nonterm('Literal'))
      .addProd(f.nonterm('ArrayLiteral'))
      .addProd(f.nonterm('ObjectLiteral'))
      .addProd(f.punct('('), f.nonterm('Expression'), f.punct(')'));

    // <ObjectLiteral>
    //   -> "{" <PropertyAssignment> *: "," "}"
    syntax.getRule('ObjectLiteral')
      .addProd(f.punct('{'), f.star(f.nonterm('PropertyAssignment'),
        f.punct(',')), f.punct('}'))
      .setConstructor(myjs.ast.ObjectExpression);

    // <PropertyAssignment>
    //   -> <PropertyName> ":" <AssignmentExpression>
    syntax.getRule('PropertyAssignment')
      .addProd(f.nonterm('PropertyName'), f.punct(':'),
        f.nonterm('AssignmentExpression'))
      .setConstructor(myjs.ast.ObjectProperty);

    // <PropertyName>
    //   -> <Identifier>
    //   -> <StringLiteral>
    //   -> <NumericLiteral>
    syntax.getRule('PropertyName')
      .addProd(f.nonterm('Identifier'))
      .addProd(f.nonterm('StringLiteral'))
      .addProd(f.nonterm('NumericLiteral'));

    // <ArrayLiteral>
    //   -> "[" <AssignmentExpression> *: "," "]"
    syntax.getRule('ArrayLiteral')
      .addProd(f.punct('['), f.star(f.nonterm('AssignmentExpression'),
        f.punct(',')), f.punct(']'))
      .setConstructor(myjs.ast.ArrayExpression);

    // <ConditionalExpression>
    //   -> <OperatorExpression> ("?" <OperatorExpression> ":"
    //      <OperatorExpression>)?
    syntax.getRule('ConditionalExpression')
      .addProd(f.nonterm('OperatorExpression'), f.option(f.punct('?'),
        f.nonterm('OperatorExpression'), f.punct(':'),
        f.nonterm('OperatorExpression')))
      .setHandler(buildConditional);

    function buildConditional(cond, rest) {
      if (!rest) {
        return cond;
      } else {
        return new myjs.ast.ConditionalExpression(cond, rest[0], rest[1]);
      }
    }

    // <FunctionExpression>
    //   -> "function" <Identifier>? "(" <FormalParameterList> ")" "{"
    //      <FunctionBody> "}"
    syntax.getRule('FunctionExpression')
      .addProd(f.keyword('function'), f.option(f.nonterm('Identifier')),
        f.punct('('), f.nonterm('FormalParameterList'), f.punct(')'),
        f.punct('{'), f.nonterm('FunctionBody'), f.punct('}'))
      .setConstructor(myjs.ast.FunctionExpression);

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Expression')
    .setSyntaxProvider(getSyntax)
    .registerType('FunctionExpression', myjs.ast.FunctionExpression)
    .registerType('ThisExpression', myjs.ast.ThisExpression)
    .registerType('ArrayExpression', myjs.ast.ArrayExpression)
    .registerType('ConditionalExpression', myjs.ast.ConditionalExpression);

  myjs.registerFragment(fragment);

})();
