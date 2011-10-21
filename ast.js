// Copyright 2011 the MyJs project authors. All rights reserved.
//
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Syntax tree definitions and utilities for working with them.
 */

"use strict";

(function () {

function defineAst(namespace, env) { // offset: 12

  var utils = env.utils;

  var inherits = utils.inherits;

  namespace.internal = {};

  function accept(parent, node, visitor, skipOpt) {
    if (node && node.accept) {
      return node.accept(visitor);
    } else if (!skipOpt) {
      throw parent;
    }
  }

  function acceptAll(parent, nodes, visitor) {
    var i;
    for (i = 0; i < nodes.length; i++) {
      accept([i, parent], nodes[i], visitor);
    }
  }

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

  namespace.Visitor = Visitor;
  function Visitor() { }

  namespace.Node = Node;
  function Node() { }

  Node.prototype.traverse = function (visitor) {
    throw new Error("Abstract method called on " + this.constructor);
  };

  Node.prototype.accept = function (visitor) {
    return this.traverse(visitor);
  };

  Node.prototype.unparse = function (out) {
    out.string("#<" + this.constructor.name + ">");
  };

  /*
  Node.prototype.translate = function () {
    return this;
  };
  */

  Visitor.prototype.visitNode = function (node) {
    return node.traverse(this);
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

  Program.prototype.accept = function (visitor) {
    return visitor.visitProgram(this);
  };

  Program.prototype.traverse = function (visitor) {
    acceptAll(this, this.elements, visitor);
  };

  Visitor.prototype.visitProgram = function (node) {
    return this.visitNode(node);
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

  FunctionDeclaration.prototype.accept = function (visitor) {
    visitor.visitFunctionDeclaration(this);
  };

  FunctionDeclaration.prototype.traverse = function (visitor) {
    acceptAll(this, this.body, visitor);
  };

  Visitor.prototype.visitFunctionDeclaration = function (node) {
    this.visitNode(node);
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

  ReturnStatement.prototype.accept = function (visitor) {
    visitor.visitReturnStatement(this);
  };

  ReturnStatement.prototype.traverse = function (visitor) {
    if (this.value) {
      accept(this, this.value, visitor, true);
    }
  };

  Visitor.prototype.visitReturnStatement = function (node) {
    this.visitStatement(node);
  };

  namespace.ThrowStatement = ThrowStatement;
  inherits(ThrowStatement, Statement);
  function ThrowStatement(value) {
    this.value = value;
  }

  ThrowStatement.prototype.unparse = function (out) {
    out.string("throw ").node(this.value).string(";").newline();
  };

  ThrowStatement.prototype.accept = function (visitor) {
    visitor.visitThrowStatement(this);
  };

  ThrowStatement.prototype.traverse = function (visitor) {
    accept(this, this.value, visitor, true);
  };

  Visitor.prototype.visitThrowStatement = function (node) {
    this.visitStatement(node);
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

  Block.prototype.accept = function (visitor) {
    visitor.visitBlock(this);
  };

  Block.prototype.traverse = function (visitor) {
    acceptAll(this, this.stmts, visitor);
  };

  Visitor.prototype.visitBlock = function (node) {
    this.visitStatement(node);
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

  VariableStatement.prototype.accept = function (visitor) {
    visitor.visitVariableStatement(this);
  };

  VariableStatement.prototype.traverse = function (visitor) {
    acceptAll(this, this.decls, visitor);
  };

  Visitor.prototype.visitVariableStatement = function (node) {
    this.visitStatement(node);
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

  VariableDeclaration.prototype.accept = function (visitor) {
    visitor.visitVariableDeclaration(this);
  };

  VariableDeclaration.prototype.traverse = function (visitor) {
    if (this.value) {
      accept(this, this.value, visitor, true);
    }
  };

  Visitor.prototype.visitVariableDeclaration = function (node) {
    this.visitNode(node);
  };

  inherits(Statement, Node);
  function Statement() {

  }

  Visitor.prototype.visitStatement = function (node) {
    this.visitNode(node);
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

  IfStatement.prototype.accept = function (visitor) {
    visitor.visitIfStatement(this);
  };

  IfStatement.prototype.traverse = function (visitor) {
    accept(this, this.cond, visitor, true);
    accept(this, this.thenPart, visitor);
    if (this.elsePart) {
      accept(this, this.elsePart, visitor);
    }
  };

  Visitor.prototype.visitIfStatement = function (node) {
    this.visitStatement(node);
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

  SwitchStatement.prototype.accept = function (visitor) {
    visitor.visitSwitchStatement(this);
  };

  SwitchStatement.prototype.traverse = function (visitor) {
    accept(this, this.value, visitor, true);
    acceptAll(this, this.cases, visitor);
  };

  Visitor.prototype.visitSwitchStatement = function (node) {
    this.visitStatement(node);
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

  SwitchCase.prototype.accept = function (visitor) {
    visitor.visitSwitchCase(this);
  };

  SwitchCase.prototype.traverse = function (visitor) {
    if (this.test) {
      accept(this, this.test, visitor, true);
    }
    acceptAll(this, this.body, visitor);
  };

  Visitor.prototype.visitSwitchCase = function (node) {
    this.visitNode(node);
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

  WhileStatement.prototype.accept = function (visitor) {
    visitor.visitWhileStatement(this);
  };

  WhileStatement.prototype.traverse = function (visitor) {
    accept(this, this.cond, visitor, true);
    accept(this, this.body, visitor);
  };

  Visitor.prototype.visitWhileStatement = function (node) {
    this.visitStatement(node);
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

  ForStatement.prototype.accept = function (visitor) {
    visitor.visitForStatement(this);
  };

  ForStatement.prototype.traverse = function (visitor) {
    if (this.init) {
      accept(this, this.init, visitor, true);
    }
    if (this.test) {
      accept(this, this.test, visitor, true);
    }
    if (this.update) {
      accept(this, this.update, visitor, true);
    }
    accept(this, this.body, visitor);
  };

  Visitor.prototype.visitForStatement = function (node) {
    this.visitStatement(node);
  };

  namespace.ForInStatement = ForInStatement;
  inherits(ForInStatement, Statement);
  function ForInStatement(target, source, body) {
    this.target = target;
    this.source = source;
    this.body = body;
  }

  ForInStatement.prototype.accept = function (visitor) {
    visitor.visitForInStatement(this);
  };

  ForInStatement.prototype.traverse = function (visitor) {
    accept(this, this.target, visitor, true);
    accept(this, this.source, visitor, true);
    accept(this, this.body, visitor);
  };

  Visitor.prototype.visitForInStatement = function (node) {
    this.visitStatement(node);
  };

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

  ExpressionStatement.prototype.accept = function (visitor) {
    return visitor.visitExpressionStatement(this);
  };

  ExpressionStatement.prototype.traverse = function (visitor) {
    accept(this, this.expr, visitor, true);
  };

  Visitor.prototype.visitExpressionStatement = function (node) {
    return this.visitStatement(node);
  };

  inherits(Expression, Node);
  function Expression() {

  }

  Visitor.prototype.visitExpression = function (node) {
    this.visitNode(node);
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

  AssignmentExpression.prototype.accept = function (visitor) {
    visitor.visitAssignmentExpression(this);
  };

  AssignmentExpression.prototype.traverse = function (visitor) {
    accept(this, this.target, visitor, true);
    accept(this, this.source, visitor, true);
  };

  Visitor.prototype.visitAssignmentExpression = function (node) {
    this.visitExpression(node);
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

  InfixExpression.prototype.accept = function (visitor) {
    return visitor.visitInfixExpression(this);
  };

  InfixExpression.prototype.traverse = function (visitor) {
    accept(this, this.left, visitor, true);
    accept(this, this.right, visitor, true);
  };

  Visitor.prototype.visitInfixExpression = function (node) {
    return this.visitExpression(node);
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

  ConditionalExpression.prototype.accept = function (visitor) {
    visitor.visitConditionalExpression(this);
  };

  ConditionalExpression.prototype.traverse = function (visitor) {
    accept(this, this.cond, visitor, true);
    accept(this, this.thenPart, visitor, true);
    accept(this, this.elsePart, visitor, true);
  };

  Visitor.prototype.visitConditionalExpression = function (node) {
    this.visitExpression(node);
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

  FunctionExpression.prototype.accept = function (visitor) {
    visitor.visitFunctionExpression(this);
  };

  FunctionExpression.prototype.traverse = function (visitor) {
    acceptAll(this, this.body, visitor);
  };

  Visitor.prototype.visitFunctionExpression = function (node) {
    return this.visitExpression(node);
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

  CallExpression.prototype.accept = function (visitor) {
    return visitor.visitCallExpression(this);
  };

  CallExpression.prototype.traverse = function (visitor) {
    accept(this, this.base, visitor, true);
    accept(this, this.args, visitor, true);
  };

  Visitor.prototype.visitCallExpression = function (node) {
    this.visitExpression(node);
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

  Literal.prototype.accept = function (visitor) {
    return visitor.visitLiteral(this);
  };

  Literal.prototype.traverse = function (visitor) {
    // ignore
  };

  Visitor.prototype.visitLiteral = function (node) {
    return this.visitExpression(node);
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
