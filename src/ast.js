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
 * @fileoverview Utilitied for working with JSON syntax trees for javascript
 * programs. The structure of the syntax trees is taken directly from the
 * mozilla parser api, http://developer.mozilla.org/en/SpiderMonkey/Parser_API,
 * but without any of the SpiderMonkey-specific extensions.
 */

'use strict';

goog.provide('myjs.ast');

goog.require('myjs.utils');

/**
 * A syntax tree node.
 *
 * @constructor
 */
myjs.ast.Node = function() {
  /**
   * A string representing the AST variant type.
   * @type {string}
   */
  this.type = null;
};

/**
 * A standard function element.
 *
 * @param {myjs.ast.Identifier} id the name of the function.
 * @param {Array.<myjs.ast.Identifier>} params the function's parameters.
 * @param {myjs.ast.BlockStatement} body the body of the function.
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.Function = function(id, params, body) {
  /**
   * The name of the function.
   * @type {myjs.ast.Identifier}
   */
  this.id = id;

  /**
   * This function's parameters.
   * @type {Array.<myjs.ast.Identifier>}
   */
  this.params = params;

  /**
   * The body of this function.
   * @type {myjs.ast.BlockStatement}
   */
  this.body = body;
};

/**
 * Any statement.
 *
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.Statement = function() { };

/**
 * An empty statement, i.e., a solitary semicolon.
 *
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.EmptyStatement = function() {
  /**
   * "EmptyStatement"
   * @const
   */
  this.type = 'EmptyStatement';
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

myjs.ast.WithStatement = function(object, body) {
  this.type = 'WithStatement';
  this.object = object;
  this.body = body;
};

myjs.ast.SwitchStatement = function(discriminant, cases) {
  this.type = 'SwitchStatement';
  this.discriminant = discriminant;
  this.cases = cases;
};

myjs.ast.SwitchCase = function(test, consequent) {
  this.type = 'SwitchCase';
  this.test = test;
  this.consequent = consequent;
};

myjs.ast.ReturnStatement = function(argument) {
  this.type = 'ReturnStatement';
  this.argument = argument;
};

myjs.ast.ThrowStatement = function(argument) {
  this.type = 'ThrowStatement';
  this.argument = argument;
};

myjs.ast.TryStatement = function(block, handler, finalizer) {
  this.type = 'TryStatement';
  this.block = block;
  this.handler = handler;
  this.finalizer = finalizer;
};

myjs.ast.CatchClause = function(param, body) {
  this.type = 'CatchClause';
  this.param = param;
  this.body = body;
};

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

myjs.ast.ThisExpression = function() {
  this.type = 'ThisExpression';
};

myjs.ast.ThisExpression.INSTANCE_ = new myjs.ast.ThisExpression();

myjs.ast.ThisExpression.get = function () {
  return myjs.ast.ThisExpression.INSTANCE_;
};

myjs.ast.ArrayExpression = function(elements) {
  this.type = 'ArrayExpression';
  this.elements = elements;
};

myjs.ast.ObjectExpression = function(properties) {
  this.type = 'ObjectExpression';
  this.properties = properties;
};

myjs.ast.ObjectProperty = function(key, value) {
  this.key = key;
  this.value = value;
};

myjs.ast.FunctionExpression = function(id, params, body) {
  this.type = 'FunctionExpression';
  this.id = id;
  this.params = params;
  this.body = body;
};

myjs.ast.SequenceExpression = function(expressions) {
  this.type = 'SequenceExpression';
  this.expressions = expressions;
};

myjs.ast.UnaryExpression = function(operator, argument, prefix) {
  this.type = 'UnaryExpression';
  this.operator = operator;
  this.argument = argument;
  this.prefix = prefix;
};

myjs.ast.UnaryOperator = function(token) {
  this.type = 'UnaryOperator';
  this.token = token;
};

myjs.ast.UpdateOperator = function(token) {
  this.type = 'UpdateOperator';
  this.token = token;
};

myjs.ast.BinaryExpression = function(left, operator, right) {
  this.type = 'BinaryExpression';
  this.left = left;
  this.operator = operator;
  this.right = right;
};

myjs.ast.BinaryOperator = function(token) {
  this.type = 'BinaryOperator';
  this.token = token;
};

myjs.ast.AssignmentExpression = function(left, operator, right) {
  this.type = 'AssignmentExpression';
  this.left = left;
  this.operator = operator;
  this.right = right;
};

myjs.ast.AssignmentOperator = function(token) {
  this.type = 'AssignmentOperator';
  this.token = token;
};

myjs.ast.UpdateExpression = function(operator, argument, prefix) {
  this.type = 'UpdateExpression';
  this.operator = operator;
  this.argument = argument;
  this.prefix = prefix;
};

myjs.ast.LogicalExpression = function(left, operator, right) {
  this.type = 'LogicalExpression';
  this.operator = operator;
  this.left = left;
  this.right = right;
};

myjs.ast.LogicalOperator = function(token) {
  this.type = 'LogicalOperator';
  this.token = token;
};

myjs.ast.ConditionalExpression = function(test, consequent, alternate) {
  this.type = 'ConditionalExpression';
  this.test = test;
  this.consequent = consequent;
  this.alternate = alternate;
};
