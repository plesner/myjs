// Copyright 2011 the MyJs project authors. All rights reserved.
//
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Syntax tree definitions and utilities for working with them.
 */

"use strict";

(function defineMyJsAst(namespace) { // offset: 12

  var inherits = tedir.internal.inherits;

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

  Visitor.prototype.visitNode = function (node) {
    return node.traverse(this);
  };

  namespace.Program = Program;
  inherits(Program, Node);
  function Program(elements) {
    this.elements = elements;
  }

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

  FunctionExpression.prototype.accept = function (visitor) {
    visitor.visitFunctionExpression(this);
  };

  FunctionExpression.prototype.traverse = function (visitor) {
    acceptAll(this, this.body, visitor);
  };

  Visitor.prototype.visitFunctionExpression = function (node) {
    return this.visitExpression(node);
  };

  namespace.GetMemberExpression = GetMemberExpression;
  inherits(GetMemberExpression, Expression);
  function GetMemberExpression(base, member) {
    this.base = base;
    this.member = member;
  }

  namespace.CallExpression = CallExpression;
  inherits(CallExpression, Expression);
  function CallExpression(base, args) {
    this.base = base;
    this.args = args;
  }

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

  namespace.Literal = Literal;
  inherits(Literal, Expression);
  function Literal(value) {
    this.value = value;
  }

  Literal.prototype.accept = function (visitor) {
    return visitor.visitLiteral(this);
  };

  Literal.prototype.traverse = function (visitor) {
    // ignore
  };

  Visitor.prototype.visitLiteral = function (node) {
    return this.visitExpression(node);
  };

  namespace.getSource = function () {
    return String(defineMyJsAst);
  };

})(myjs.ast);
