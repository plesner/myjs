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
 * Syntax tree definitions and utilities for working with them.
 */

"use strict";

(function () {

function defineAst(namespace, env) { // offset: 12

  var utils = env.utils;

  var inherits = utils.inherits;

  namespace.internal = {};

  namespace.internal.TextFormatter = TextFormatter;
  function TextFormatter(settings) {
    this.settings = settings;
    this.tokens = [];
    this.indentLevel = 0;
    this.newlineScheduled = false;
  }

  TextFormatter.prototype.indent = function () {
    this.indentLevel++;
    return this;
  };

  TextFormatter.prototype.deindent = function () {
    this.indentLevel--;
    return this;
  };

  TextFormatter.prototype.strings = function (elms, sepOpt) {
    var i;
    for (i = 0; i < elms.length; i++) {
      if (sepOpt && i > 0) {
        this.string(sepOpt);
      }
      this.string(elms[i]);
    }
    return this;
  };

  TextFormatter.prototype.string = function (format) {
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

  TextFormatter.prototype.nodes = function (elms, sepOpt) {
    var i;
    for (i = 0; i < elms.length; i++) {
      if (sepOpt && i > 0) {
        this.string(sepOpt);
      }
      this.node(elms[i]);
    }
    return this;
  };

  TextFormatter.prototype.node = function (elm) {
    elm.unparse(this);
    return this;
  };

  TextFormatter.prototype.addOptNode = function (elm) {
    if (elm) {
      elm.unparse(this);
    }
    return this;
  };

  TextFormatter.prototype.newline = function () {
    this.newlineScheduled = true;
    return this;
  };

  TextFormatter.prototype.flush = function () {
    return this.tokens.join("");
  };

  namespace.Node = Node;
  function Node() { }

  inherits(Statement, Node);
  namespace.Statement = Statement;
  function Statement() { }

  inherits(Expression, Node);
  namespace.Expression = Expression;
  function Expression() { }

  Node.prototype.unparse = function (out) {
    out.string("#<" + this.constructor.name + ">");
  };

  function translateAll(elms) {
    var result = [];
    elms.forEach(function (elm) {
      var newElm = elm.translate();
      if (Array.isArray(newElm)) {
        result = result.concat(newElm);
      } else {
        result.push(newElm);
      }
    });
    return result;
  }

  namespace.Program = Program;
  inherits(Program, Node);
  function Program(elements) {
    this.elements = elements;
  }

  Program.prototype.translate = function () {
    return new Program(translateAll(this.elements));
  };

  Program.prototype.unparse = function (out) {
    this.elements.forEach(function (element) {
      element.unparse(out);
    });
  };

  namespace.FunctionDeclaration = FunctionDeclaration;
  inherits(FunctionDeclaration, Node);
  function FunctionDeclaration(name, params, body) {
    this.name = name;
    this.params = params;
    this.body = body;
  }

  FunctionDeclaration.prototype.translate = function () {
    return new FunctionDeclaration(this.name, this.params,
      translateAll(this.body));
  };

  FunctionDeclaration.prototype.unparse = function (out) {
    out.string("function ").string(this.name).string("(")
      .strings(this.params, ", ").string(") {").indent().newline()
      .nodes(this.body).deindent().string("}").newline();
  };

  namespace.ReturnStatement = ReturnStatement;
  inherits(ReturnStatement, Statement);
  function ReturnStatement(valueOpt) {
    this.value = valueOpt;
  }

  ReturnStatement.prototype.translate = function () {
    if (this.value) {
      return new ReturnStatement(this.value.translate());
    } else {
      return this;
    }
  };

  ReturnStatement.prototype.unparse = function (out) {
    if (this.value) {
      out.string("return ").node(this.value).string(";").newline();
    } else {
      out.string("return;").newline();
    }
  };

  namespace.ThrowStatement = ThrowStatement;
  inherits(ThrowStatement, Statement);
  function ThrowStatement(value) {
    this.value = value;
  }

  ThrowStatement.prototype.unparse = function (out) {
    out.string("throw ").node(this.value).string(";").newline();
  };

  namespace.Block = Block;
  inherits(Block, Statement);
  function Block(stmts) {
    this.stmts = stmts;
  }

  Block.prototype.translate = function () {
    return new Block(translateAll(this.stmts));
  };

  Block.prototype.unparse = function (out) {
    out.string("{").indent().newline().nodes(this.stmts).deindent()
      .string("}");
  };

  namespace.VariableStatement = VariableStatement;
  inherits(VariableStatement, Statement);
  function VariableStatement(decls) {
    this.decls = decls;
  }

  VariableStatement.prototype.translate = function () {
    return new VariableStatement(translateAll(this.decls));
  };

  VariableStatement.prototype.unparse = function (out) {
    out.string("var ").nodes(this.decls, ", ").string(";").newline();
  };

  namespace.VariableDeclaration = VariableDeclaration;
  inherits(VariableDeclaration, Node);
  function VariableDeclaration(name, value) {
    this.name = name;
    this.value = value;
  }

  VariableDeclaration.prototype.translate = function () {
    return new VariableDeclaration(this.name, this.value.translate());
  };

  VariableDeclaration.prototype.unparse = function (out) {
    out.string(this.name);
    if (this.value) {
      out.string(" = (").node(this.value).string(")");
    }
  };

  namespace.IfStatement = IfStatement;
  inherits(IfStatement, Statement);
  function IfStatement(cond, thenPart, elsePart) {
    this.cond = cond;
    this.thenPart = thenPart;
    this.elsePart = elsePart;
  }

  IfStatement.prototype.translate = function () {
    var newCond = this.cond.translate();
    var newThen = this.thenPart.translate();
    var newElse = this.elsePart ? this.elsePart.translate() : null;
    return new IfStatement(newCond, newThen, newElse);
  };

  IfStatement.prototype.unparse = function (out) {
    out.string("if (").node(this.cond).string(") ").node(this.thenPart);
    if (this.elsePart) {
      out.string(" else ").node(this.elsePart);
    }
    out.newline();
  };

  namespace.SwitchStatement = SwitchStatement;
  inherits(SwitchStatement, Statement);
  function SwitchStatement(value, cases) {
    this.value = value;
    this.cases = cases;
  }

  SwitchStatement.prototype.unparse = function (out) {
    out.string("switch (").node(this.value).string(") {")
      .indent().newline().nodes(this.cases).deindent()
      .string("}").newline();
  };

  namespace.SwitchCase = SwitchCase;
  inherits(SwitchCase, Node);
  function SwitchCase(test, body) {
    this.test = test;
    this.body = body;
  }

  SwitchCase.prototype.unparse = function (out) {
    if (this.test) {
      out.string("case ").node(this.test).string(": ");
    } else {
      out.string("default: ");
    }
    out.indent().newline().nodes(this.body).deindent().newline();
  };

  namespace.DoStatement = DoStatement;
  inherits(DoStatement, Statement);
  function DoStatement(body, cond) {
    this.body = body;
    this.cond = cond;
  }

  namespace.WhileStatement = WhileStatement;
  inherits(WhileStatement, Statement);
  function WhileStatement(cond, body) {
    this.cond = cond;
    this.body = body;
  }

  WhileStatement.prototype.unparse = function (out) {
    out.string("while (").node(this.cond).string(") ")
      .node(this.body).newline();
  };

  namespace.ForStatement = ForStatement;
  inherits(ForStatement, Statement);
  function ForStatement(init, test, update, body) {
    this.init = init;
    this.test = test;
    this.update = update;
    this.body = body;
  }

  ForStatement.prototype.unparse = function (out) {
    out.string("for (").addOptNode(this.init).string(";")
      .addOptNode(this.test).string(";").addOptNode(this.update)
      .string(") ").node(this.body).newline();
  };

  namespace.ForInStatement = ForInStatement;
  inherits(ForInStatement, Statement);
  function ForInStatement(target, source, body) {
    this.target = target;
    this.source = source;
    this.body = body;
  }

  namespace.ContinueStatement = ContinueStatement;
  inherits(ContinueStatement, Statement);
  function ContinueStatement(label) {
    this.label = label;
  }

  namespace.ExpressionStatement = ExpressionStatement;
  inherits(ExpressionStatement, Statement);
  function ExpressionStatement(expr) {
    this.expr = expr;
  }

  ExpressionStatement.prototype.unparse = function (out) {
    out.node(this.expr).string(";").newline();
  };

  ExpressionStatement.prototype.translate = function () {
    return new ExpressionStatement(this.expr.translate());
  };

  namespace.AssignmentExpression = AssignmentExpression;
  inherits(AssignmentExpression, Expression);
  function AssignmentExpression(target, op, source) {
    this.target = target;
    this.op = op;
    this.source = source;
  }

  AssignmentExpression.prototype.translate = function () {
    return new AssignmentExpression(this.target.translate(), this.op,
      this.source.translate());
  };

  AssignmentExpression.prototype.unparse = function (out) {
    out.node(this.target).string(" " + this.op + " (")
      .node(this.source).string(")");
  };

  namespace.InfixExpression = InfixExpression;
  inherits(InfixExpression, Expression);
  function InfixExpression(left, op, right) {
    this.left = left;
    this.op = op;
    this.right = right;
  }

  InfixExpression.prototype.translate = function () {
    return new InfixExpression(this.left.translate(), this.op,
      this.right.translate());
  };

  InfixExpression.prototype.unparse = function (out) {
    out.string("(").node(this.left).string(") " + this.op + " (")
      .node(this.right).string(")");
  };

  namespace.ConditionalExpression = ConditionalExpression;
  inherits(ConditionalExpression, Expression);
  function ConditionalExpression(cond, thenPart, elsePart) {
    this.cond = cond;
    this.thenPart = thenPart;
    this.elsePart = elsePart;
  }

  ConditionalExpression.prototype.translate = function () {
    var newCond = this.cond.translate();
    var newThen = this.thenPart.translate();
    var newElse = this.elsePart ? this.elsePart.translate() : null;
    return new ConditionalExpression(newCond, newThen, newElse);
  };

  ConditionalExpression.prototype.unparse = function (out) {
    out.string("(").node(this.cond).string(") ? (")
      .node(this.thenPart).string(") : (").node(this.elsePart)
      .string(")");
  };

  namespace.FunctionExpression = FunctionExpression;
  inherits(FunctionExpression, Expression);
  function FunctionExpression(name, params, body) {
    this.name = name;
    this.params = params;
    this.body = body;
  }

  FunctionExpression.prototype.translate = function () {
    return new FunctionExpression(this.name, this.params,
      translateAll(this.body));
  };

  FunctionExpression.prototype.unparse = function (out) {
    out.string("function ").string(this.name).string("(")
      .strings(this.params, ", ").string(") {").indent().newline()
      .nodes(this.body).deindent().string("}");
  };

  namespace.GetPropertyExpression = GetPropertyExpression;
  inherits(GetPropertyExpression, Expression);
  function GetPropertyExpression(base, member) {
    this.base = base;
    this.member = member;
  }

  GetPropertyExpression.prototype.translate = function () {
    return new GetPropertyExpression(this.base.translate(),
      this.member);
  };

  GetPropertyExpression.prototype.unparse = function (out) {
    out.string("(").node(this.base).string(")").string(".")
      .string(this.member);
  };

  namespace.GetElementExpression = GetElementExpression;
  inherits(GetElementExpression, Expression);
  function GetElementExpression(base, key) {
    this.base = base;
    this.key = key;
  }

  GetElementExpression.prototype.translate = function () {
    return new GetElementExpression(this.base.translate(),
      this.key.translate());
  };

  GetElementExpression.prototype.unparse = function (out) {
    out.string("(").node(this.base).string(")[").string(".")
      .node(this.key).string("]");
  };

  namespace.CallExpression = CallExpression;
  inherits(CallExpression, Expression);
  function CallExpression(base, args) {
    this.base = base;
    this.args = args;
  }

  CallExpression.prototype.translate = function () {
    return new CallExpression(this.base.translate(),
      translateAll(this.args));
  };

  CallExpression.prototype.unparse = function (out) {
    out.string("(").node(this.base).string(")(")
      .nodes(this.args, ", ").string(")");
  };

  namespace.UnaryExpression = UnaryExpression;
  inherits(UnaryExpression, Expression);
  function UnaryExpression(base, op, isPrefix) {
    this.base = base;
    this.op = op;
    this.isPrefix = isPrefix;
  }

  UnaryExpression.PREFIX = true;
  UnaryExpression.POSTFIX = false;

  UnaryExpression.prototype.translate = function () {
    return new UnaryExpression(this.base.translate(), this.op, this.isPrefix);
  };

  UnaryExpression.prototype.unparse = function (out) {
    if (this.isPrefix) {
      out.string(this.op);
    }
    out.string("(").node(this.base).string(")");
    if (!this.isPrefix) {
      out.string(this.op);
    }
  };

  namespace.NewExpression = NewExpression;
  inherits(NewExpression, Expression);
  function NewExpression(base, args) {
    this.base = base;
    this.args = args;
  }

  NewExpression.prototype.translate = function () {
    return new NewExpression(this.base.translate(), translateAll(this.args));
  };

  NewExpression.prototype.unparse = function (out) {
    out.string("new (").node(this.base).string(")(")
      .nodes(this.args, ", ").string(")");
  };

  namespace.Literal = Literal;
  inherits(Literal, Expression);
  function Literal(value) {
    this.value = value;
  }

  Literal.prototype.translate = function () {
    return this;
  };

  Literal.prototype.unparse = function (out) {
    out.string(this.value);
  };

  namespace.Identifier = Identifier;
  inherits(Identifier, Expression);
  function Identifier(name) {
    this.name = name;
  }

  Identifier.prototype.translate = function () {
    return this;
  };

  Identifier.prototype.unparse = function (out) {
    out.string(this.name);
  };

  namespace.This = This;
  inherits(This, Expression);
  function This() { }

  This.prototype.translate = function () {
    return this;
  };

  This.prototype.unparse = function (out) {
    out.string("this");
  };

  namespace.ObjectLiteral = ObjectLiteral;
  inherits(ObjectLiteral, Expression);
  function ObjectLiteral(elms) {
    this.elms = elms;
  }

  ObjectLiteral.prototype.unparse = function (out) {
    out.string("{").string(this.elms, ", ").string("}");
  };

  namespace.ArrayLiteral = ArrayLiteral;
  inherits(ArrayLiteral, Expression);
  function ArrayLiteral(elms) {
    this.elms = elms;
  }

  ArrayLiteral.prototype.translate = function () {
    return new ArrayLiteral(translateAll(this.elms));
  };

  ArrayLiteral.prototype.unparse = function (out) {
    out.string("[").nodes(this.elms, ", ").string("]");
  };

  namespace.getSource = function () {
    return String(defineAst);
  };

  return namespace;

}

if (typeof module == "undefined") {
  this.ast = this.ast || defineAst({}, this);
} else {
  defineAst(module.exports, {
    utils: require('./utils')
  });
}

}).call(this);
