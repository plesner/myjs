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
 * A this expression.
 *
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.ThisExpression = function() {
  this.type = 'ThisExpression';
};

/**
 * @private
 */
myjs.ast.ThisExpression.INSTANCE_ = new myjs.ast.ThisExpression();

/**
 * Returns the singleton instance of a this-expression.
 *
 * @return {myjs.ast.Expression} a singleton this expression.
 */
myjs.ast.ThisExpression.get = function() {
  return myjs.ast.ThisExpression.INSTANCE_;
};

/**
 * @inheritDoc
 */
myjs.ast.ThisExpression.prototype.unparse = function(context) {
  context.write('this');
};

/**
 * An array expression.
 *
 * @param {Array.<myjs.ast.Expression>} elements the array elements.
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.ArrayExpression = function(elements) {
  this.type = 'ArrayExpression';
  this.elements = elements;
};

/**
 * @inheritDoc
 */
myjs.ast.ArrayExpression.prototype.unparse = function(context) {
  context.write('[').nodes(this.elements, ', ').write(']');
};

/**
 * An object expression.
 *
 * @param {Array.<myjs.ast.ObjectProperty>} properties the object's
 *   properties.
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.ObjectExpression = function(properties) {
  this.type = 'ObjectExpression';
  this.properties = properties;
};

/**
 * @inheritDoc
 */
myjs.ast.ObjectExpression.prototype.unparse = function(stream) {
  stream.write('{').nodes(this.properties, ', ').write('}');
};

/**
 * A single object property.
 *
 * @param {myjs.ast.Literal} key the property key.
 * @param {myjs.ast.Expression} value the property value.
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.ObjectProperty = function(key, value) {
  this.type = 'ObjectProperty';
  this.key = key;
  this.value = value;
};

/**
 * @inheritDoc
 */
myjs.ast.ObjectProperty.prototype.unparse = function(stream) {
  stream.node(this.key).write(': ').node(this.value);
};

/**
 * A function expression.
 *
 * @param {?myjs.ast.Identifier} id optional function name.
 * @param {Array.<myjs.ast.Identifier>} params function parameters.
 * @param {myjs.ast.BlockStatement} body the function body.
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.FunctionExpression = function(id, params, body) {
  this.type = 'FunctionExpression';
  this.id = id;
  this.params = params;
  this.body = body;
};

/**
 * @inheritDoc
 */
myjs.ast.FunctionExpression.prototype.unparse = function(context) {
  context.write('function ');
  if (this.id) {
    context.node(this.id);
  }
  context.write('(').nodes(this.params, ', ').write(') ').node(this.body)
    .newline();
};

/**
 * A conditional expression, i.e., a ternary ?/: expression.
 *
 * @param {myjs.ast.Expression} test the value to test.
 * @param {myjs.ast.Expression} consequent value if the test is true.
 * @param {myjs.ast.Expression} alternate value if the test is false.
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.ConditionalExpression = function(test, consequent, alternate) {
  this.type = 'ConditionalExpression';
  this.test = test;
  this.consequent = consequent;
  this.alternate = alternate;
};

/**
 * @inheritDoc
 */
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
    .registerType('ObjectExpression', myjs.ast.ObjectExpression)
    .registerType('ObjectProperty', myjs.ast.ObjectProperty)
    .registerType('ConditionalExpression', myjs.ast.ConditionalExpression);

  myjs.registerFragment(fragment);

})();
