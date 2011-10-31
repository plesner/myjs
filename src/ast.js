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
 * A standard Program element.
 *
 * @param {Array} body the program elements.
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.Program = function(body) {
  /**
   * "Program"
   * @const
   */
  this.type = 'Program';

  /**
   * The program elements.
   * @type {Array}
   */
  this.elements = body;
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

myjs.ast.BlockStatement = function(body) {
  this.type = 'BlockStatement';
  this.body = body;
};

myjs.ast.IfStatement = function(test, consequent, alternate) {
  this.type = 'IfStatement';
  this.test = test;
  this.consequent = consequent;
  this.alternate = alternate;
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

myjs.ast.TryStatement = function(block, handlers, finalizer) {
  this.type = 'TryStatement';
  this.block = block;
  this.handlers = handlers;
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

myjs.ast.UnaryExpression = function(operator, prefix, argument) {
  this.type = 'UnaryExpression';
  this.operator = operator;
  this.prefix = prefix;
  this.argument = argument;
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

myjs.ast.AssignmentExpression = function(left, operator, right) {
  this.type = 'AssignmentExpression';
  this.left = left;
  this.operator = operator;
  this.right = right;
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
  this.consequence = consequence;
  this.alternate = alternate;
};

myjs.ast.NewExpression = function(constructor, args) {
  this.type = 'NewExpression';
  this.constructor = constructor;
  this.args = args;
};

myjs.ast.CallExpression = function(callee, args) {
  this.type = 'CallExpression';
  this.callee = callee;
  this.args = args;
};

myjs.ast.MemberExpression = function(object, property, computed) {
  this.type = 'MemberExpression';
  this.object = object;
  this.property = property;
  this.computed = computed;
};

myjs.ast.Identifier = function(name) {
  this.type = 'Identifier';
  this.name = name;
};

myjs.ast.Literal = function(value) {
  this.type = 'Literal';
  this.value = value;
};

myjs.ast.TextFormatter = function(settings) {
  this.settings = settings;
  this.tokens = [];
  this.indentLevel = 0;
  this.newlineScheduled = false;
};

myjs.ast.TextFormatter.prototype.indent = function() {
  this.indentLevel++;
  return this;
};

myjs.ast.TextFormatter.prototype.deindent = function() {
  this.indentLevel--;
  return this;
};

myjs.ast.TextFormatter.prototype.strings = function(elms, sepOpt) {
  var i;
  for (i = 0; i < elms.length; i++) {
    if (sepOpt && i > 0) {
      this.string(sepOpt);
    }
    this.string(elms[i]);
  }
  return this;
};

myjs.ast.TextFormatter.prototype.string = function(format) {
  var i;
  if (this.newlineScheduled) {
    this.newlineScheduled = false;
    this.string(this.settings.newline);
    for (i = 0; i < this.indentLevel; i++) {
      this.string(this.settings.indent);
    }
  }
  this.tokens.push(format);
  return this;
};

myjs.ast.TextFormatter.prototype.nodes = function(elms, sepOpt) {
  var i;
  for (i = 0; i < elms.length; i++) {
    if (sepOpt && i > 0) {
      this.string(sepOpt);
    }
    this.node(elms[i]);
  }
  return this;
};

myjs.ast.TextFormatter.prototype.node = function(elm) {
  elm.unparse(this);
  return this;
};

myjs.ast.TextFormatter.prototype.addOptNode = function(elm) {
  if (elm) {
    elm.unparse(this);
  }
  return this;
};

myjs.ast.TextFormatter.prototype.newline = function() {
  this.newlineScheduled = true;
  return this;
};

myjs.ast.TextFormatter.prototype.flush = function() {
  return this.tokens.join('');
};

myjs.ast.Node = function() { };

myjs.ast.Statement = function() { };
goog.inherits(myjs.ast.Statement, myjs.ast.Node);

myjs.ast.Expression = function() { };
goog.inherits(myjs.ast.Expression, myjs.ast.Node);

myjs.ast.Node.prototype.unparse = function(out) {
  out.string('#<' + this.constructor.name + '>');
};

function translateAll(elms) {
  var result = [];
  elms.forEach(function(elm) {
    var newElm = elm.translate();
    if (Array.isArray(newElm)) {
      result = result.concat(newElm);
    } else {
      result.push(newElm);
    }
  });
  return result;
}

myjs.ast.Program.prototype.translate = function() {
  return new myjs.ast.Program(translateAll(this.elements));
};

myjs.ast.Program.prototype.unparse = function(out) {
  this.elements.forEach(function(element) {
    element.unparse(out);
  });
};

myjs.ast.FunctionDeclaration = function(name, params, body) {
  this.name = name;
  this.params = params;
  this.body = body;
};
goog.inherits(myjs.ast.FunctionDeclaration, myjs.ast.Node);

myjs.ast.FunctionDeclaration.prototype.translate = function() {
  return new myjs.ast.FunctionDeclaration(this.name, this.params,
    translateAll(this.body));
};

myjs.ast.FunctionDeclaration.prototype.unparse = function(out) {
  out.string('function ').string(this.name).string('(')
    .strings(this.params, ', ').string(') {').indent().newline()
    .nodes(this.body).deindent().string('}').newline();
};

myjs.ast.ReturnStatement = function(valueOpt) {
  this.value = valueOpt;
};
goog.inherits(myjs.ast.ReturnStatement, myjs.ast.Statement);

myjs.ast.ReturnStatement.prototype.translate = function() {
  if (this.value) {
    return new myjs.ast.ReturnStatement(this.value.translate());
  } else {
    return this;
  }
};

myjs.ast.ReturnStatement.prototype.unparse = function(out) {
  if (this.value) {
    out.string('return ').node(this.value).string(';').newline();
  } else {
    out.string('return;').newline();
  }
};

myjs.ast.ThrowStatement = function(value) {
  this.value = value;
};
goog.inherits(myjs.ast.ThrowStatement, myjs.ast.Statement);

myjs.ast.ThrowStatement.prototype.unparse = function(out) {
  out.string('throw ').node(this.value).string(';').newline();
};

myjs.ast.Block = function(stmts) {
  this.stmts = stmts;
};
goog.inherits(myjs.ast.Block, myjs.ast.Statement);

myjs.ast.Block.prototype.translate = function() {
  return new myjs.ast.Block(translateAll(this.stmts));
};

myjs.ast.Block.prototype.unparse = function(out) {
  out.string('{').indent().newline().nodes(this.stmts).deindent()
    .string('}');
};

myjs.ast.VariableStatement = function(decls) {
  this.decls = decls;
};
goog.inherits(myjs.ast.VariableStatement, myjs.ast.Statement);

myjs.ast.VariableStatement.prototype.translate = function() {
  return new myjs.ast.VariableStatement(translateAll(this.decls));
};

myjs.ast.VariableStatement.prototype.unparse = function(out) {
  out.string('var ').nodes(this.decls, ', ').string(';').newline();
};

myjs.ast.VariableDeclaration = function(name, value) {
  this.name = name;
  this.value = value;
};
goog.inherits(myjs.ast.VariableDeclaration, myjs.ast.Node);

myjs.ast.VariableDeclaration.prototype.translate = function() {
  return new myjs.ast.VariableDeclaration(this.name, this.value.translate());
};

myjs.ast.VariableDeclaration.prototype.unparse = function(out) {
  out.string(this.name);
  if (this.value) {
    out.string(' = (').node(this.value).string(')');
  }
};

myjs.ast.IfStatement = function(cond, thenPart, elsePart) {
  this.cond = cond;
  this.thenPart = thenPart;
  this.elsePart = elsePart;
};
goog.inherits(myjs.ast.IfStatement, myjs.ast.Statement);

myjs.ast.IfStatement.prototype.translate = function() {
  var newCond = this.cond.translate();
  var newThen = this.thenPart.translate();
  var newElse = this.elsePart ? this.elsePart.translate() : null;
  return new myjs.ast.IfStatement(newCond, newThen, newElse);
};

myjs.ast.IfStatement.prototype.unparse = function(out) {
  out.string('if (').node(this.cond).string(') ').node(this.thenPart);
  if (this.elsePart) {
    out.string(' else ').node(this.elsePart);
  }
  out.newline();
};

myjs.ast.SwitchStatement = function(value, cases) {
  this.value = value;
  this.cases = cases;
};
goog.inherits(myjs.ast.SwitchStatement, myjs.ast.Statement);

myjs.ast.SwitchStatement.prototype.unparse = function(out) {
  out.string('switch (').node(this.value).string(') {')
    .indent().newline().nodes(this.cases).deindent()
    .string('}').newline();
};

myjs.ast.SwitchCase = function(test, body) {
  this.test = test;
  this.body = body;
};
goog.inherits(myjs.ast.SwitchCase, myjs.ast.Node);

myjs.ast.SwitchCase.prototype.unparse = function(out) {
  if (this.test) {
    out.string('case ').node(this.test).string(': ');
  } else {
    out.string('default: ');
  }
  out.indent().newline().nodes(this.body).deindent().newline();
};

myjs.ast.DoStatement = function(body, cond) {
  this.body = body;
  this.cond = cond;
};
goog.inherits(myjs.ast.DoStatement, myjs.ast.Statement);

myjs.ast.WhileStatement = function(cond, body) {
  this.cond = cond;
  this.body = body;
};
goog.inherits(myjs.ast.WhileStatement, myjs.ast.Statement);

myjs.ast.WhileStatement.prototype.unparse = function(out) {
  out.string('while (').node(this.cond).string(') ')
    .node(this.body).newline();
};

myjs.ast.ForStatement = function(init, test, update, body) {
  this.init = init;
  this.test = test;
  this.update = update;
  this.body = body;
};
goog.inherits(myjs.ast.ForStatement, myjs.ast.Statement);

myjs.ast.ForStatement.prototype.unparse = function(out) {
  out.string('for (').addOptNode(this.init).string(';')
    .addOptNode(this.test).string(';').addOptNode(this.update)
    .string(') ').node(this.body).newline();
};

myjs.ast.ForInStatement = function(target, source, body) {
  this.target = target;
  this.source = source;
  this.body = body;
};
goog.inherits(myjs.ast.ForInStatement, myjs.ast.Statement);

myjs.ast.ContinueStatement = function(label) {
  this.label = label;
};
goog.inherits(myjs.ast.ContinueStatement, myjs.ast.Statement);

myjs.ast.ExpressionStatement = function(expr) {
  this.expr = expr;
};
goog.inherits(myjs.ast.ExpressionStatement, myjs.ast.Statement);

myjs.ast.ExpressionStatement.prototype.unparse = function(out) {
  out.node(this.expr).string(';').newline();
};

myjs.ast.ExpressionStatement.prototype.translate = function() {
  return new myjs.ast.ExpressionStatement(this.expr.translate());
};

myjs.ast.AssignmentExpression = function(target, op, source) {
  this.target = target;
  this.op = op;
  this.source = source;
};
goog.inherits(myjs.ast.AssignmentExpression, myjs.ast.Expression);

myjs.ast.AssignmentExpression.prototype.translate = function() {
  return new myjs.ast.AssignmentExpression(this.target.translate(), this.op,
    this.source.translate());
};

myjs.ast.AssignmentExpression.prototype.unparse = function(out) {
  out.node(this.target).string(' ' + this.op + ' (')
    .node(this.source).string(')');
};

myjs.ast.InfixExpression = function(left, op, right) {
  this.left = left;
  this.op = op;
  this.right = right;
};
goog.inherits(myjs.ast.InfixExpression, myjs.ast.Expression);

myjs.ast.InfixExpression.prototype.translate = function() {
  return new myjs.ast.InfixExpression(this.left.translate(), this.op,
    this.right.translate());
};

myjs.ast.InfixExpression.prototype.unparse = function(out) {
  out.string('(').node(this.left).string(') ' + this.op + ' (')
    .node(this.right).string(')');
};

myjs.ast.ConditionalExpression = function(cond, thenPart, elsePart) {
  this.cond = cond;
  this.thenPart = thenPart;
  this.elsePart = elsePart;
};
goog.inherits(myjs.ast.ConditionalExpression, myjs.ast.Expression);

myjs.ast.ConditionalExpression.prototype.translate = function() {
  var newCond = this.cond.translate();
  var newThen = this.thenPart.translate();
  var newElse = this.elsePart ? this.elsePart.translate() : null;
  return new myjs.ast.ConditionalExpression(newCond, newThen, newElse);
};

myjs.ast.ConditionalExpression.prototype.unparse = function(out) {
  out.string('(').node(this.cond).string(') ? (')
    .node(this.thenPart).string(') : (').node(this.elsePart)
    .string(')');
};

myjs.ast.FunctionExpression = function(name, params, body) {
  this.name = name;
  this.params = params;
  this.body = body;
};
goog.inherits(myjs.ast.FunctionExpression, myjs.ast.Expression);

myjs.ast.FunctionExpression.prototype.translate = function() {
  return new myjs.ast.FunctionExpression(this.name, this.params,
    translateAll(this.body));
};

myjs.ast.FunctionExpression.prototype.unparse = function(out) {
  out.string('function ').string(this.name).string('(')
    .strings(this.params, ', ').string(') {').indent().newline()
    .nodes(this.body).deindent().string('}');
};

myjs.ast.GetPropertyExpression = function(base, member) {
  this.base = base;
  this.member = member;
};
goog.inherits(myjs.ast.GetPropertyExpression, myjs.ast.Expression);

myjs.ast.GetPropertyExpression.prototype.translate = function() {
  return new myjs.ast.GetPropertyExpression(this.base.translate(),
    this.member);
};

myjs.ast.GetPropertyExpression.prototype.unparse = function(out) {
  out.string('(').node(this.base).string(')').string('.')
    .string(this.member);
};

myjs.ast.GetElementExpression = function(base, key) {
  this.base = base;
  this.key = key;
};
goog.inherits(myjs.ast.GetElementExpression, myjs.ast.Expression);

myjs.ast.GetElementExpression.prototype.translate = function() {
  return new myjs.ast.GetElementExpression(this.base.translate(),
    this.key.translate());
};

myjs.ast.GetElementExpression.prototype.unparse = function(out) {
  out.string('(').node(this.base).string(')[').string('.')
    .node(this.key).string(']');
};

myjs.ast.CallExpression = function(base, args) {
  this.base = base;
  this.args = args;
};
goog.inherits(myjs.ast.CallExpression, myjs.ast.Expression);

myjs.ast.CallExpression.prototype.translate = function() {
  return new myjs.ast.CallExpression(this.base.translate(),
    translateAll(this.args));
};

myjs.ast.CallExpression.prototype.unparse = function(out) {
  out.string('(').node(this.base).string(')(')
    .nodes(this.args, ', ').string(')');
};

myjs.ast.UnaryExpression = function(base, op, isPrefix) {
  this.base = base;
  this.op = op;
  this.isPrefix = isPrefix;
};
goog.inherits(myjs.ast.UnaryExpression, myjs.ast.Expression);

myjs.ast.UnaryExpression.PREFIX = true;
myjs.ast.UnaryExpression.POSTFIX = false;

myjs.ast.UnaryExpression.prototype.translate = function() {
  return new myjs.ast.UnaryExpression(this.base.translate(), this.op, this.isPrefix);
};

myjs.ast.UnaryExpression.prototype.unparse = function(out) {
  if (this.isPrefix) {
    out.string(this.op);
  }
  out.string('(').node(this.base).string(')');
  if (!this.isPrefix) {
    out.string(this.op);
  }
};

myjs.ast.NewExpression = function(base, args) {
  this.base = base;
  this.args = args;
};
goog.inherits(myjs.ast.NewExpression, myjs.ast.Expression);

myjs.ast.NewExpression.prototype.translate = function() {
  return new myjs.ast.NewExpression(this.base.translate(), translateAll(this.args));
};

myjs.ast.NewExpression.prototype.unparse = function(out) {
  out.string('new (').node(this.base).string(')(')
    .nodes(this.args, ', ').string(')');
};
