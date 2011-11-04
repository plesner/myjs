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
 * @fileoverview Meta syntax.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

(function() {

  myjs.ast.QuoteExpression = function(value) {
    this.type = 'QuoteExpression';
    this.value = value;
  };

  function QuoteVisitor(translatePlain) {
    this.translatePlain = translatePlain;
  }

  QuoteVisitor.prototype.visitArray = function(asts, dialect) {
    var self = this;
    var elms = asts.map(function(ast) { return dialect.traverse(ast, self); });
    return new myjs.ast.ArrayExpression(elms);
  };

  QuoteVisitor.prototype.visitNode = function(ast, type, dialect) {
    if (type == myjs.ast.UnquoteExpression) {
      return (this.translatePlain)(ast.value);
    } else {
      var self = this;
      var keys = Object.keys(ast);
      var props = [];
      keys.forEach(function(key) {
        props.push(new myjs.ast.ObjectProperty(
          new myjs.ast.Identifier(key), dialect.traverse(ast[key], self)));
      });
      return new myjs.ast.ObjectExpression(props);
    }
  };

  QuoteVisitor.prototype.visitPrimitive = function(value, dialect) {
    return new myjs.ast.Literal(value);
  };

  myjs.ast.QuoteExpression.prototype.translate = function(dialect, recurse) {
    var visitor = new QuoteVisitor(recurse);
    return dialect.traverse(this.value, visitor);
  };

  myjs.ast.UnquoteExpression = function(value) {
    this.type = 'UnquoteExpression';
    this.value = value;
  };

  myjs.ast.UnquoteExpression.prototype.unparse = function(context) {
    context.node(this.value);
  };

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <PrimaryExpression>
    //   -> "`" <PrimaryExpression>
    syntax.getRule('PrimaryExpression')
      .addProd(f.punct('`'), f.nonterm('PrimaryExpression'))
      .setConstructor(myjs.ast.QuoteExpression);

    // <Identifier>
    //   -> "," <PrimaryExpression>
    syntax.getRule('Identifier')
      .addProd(f.punct(','), f.nonterm('PrimaryExpression'))
      .setConstructor(myjs.ast.UnquoteExpression);

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Meta')
    .setSyntaxProvider(getSyntax)
    .registerType('QuoteExpression', myjs.ast.QuoteExpression)
    .registerType('UnquoteExpression', myjs.ast.UnquoteExpression);

  myjs.registerFragment(fragment);

})();
