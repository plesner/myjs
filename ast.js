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
    if (node.accept) {
      return node.accept(visitor);
    } else if (!skipOpt) {
      throw parent;
    }
  }

  function acceptAll(parent, nodes, visitor) {
    nodes.forEach(function (node) { accept(parent, node, visitor); });
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

  namespace.FunctionExpression = FunctionExpression;
  inherits(FunctionExpression, Expression);
  function FunctionExpression(name, params, body) {
    this.name = name;
    this.params = params;
    this.body = body;
  }

  namespace.getSource = function () {
    return String(defineMyJsAst);
  };

})(myjs.ast);
