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

  /**
   * @constructor
   * @extends myjs.ast.Expression
   */
  myjs.ast.QuoteExpression = function(value) {
    this['type'] = 'QuoteExpression';
    this['value'] = value;
  };

  /**
   * @constructor
   * @implements myjs.AstVisitor
   */
  function QuoteVisitor(translateContext) {
    this.translateContext = translateContext;
  }

  QuoteVisitor.prototype.visitArray = function(asts, dialect) {
    function flushBuffer() {
      if (buffer.length > 0) {
        segments.push(new myjs.ast.ArrayExpression(buffer));
        buffer = [];
      }
    }
    var buffer = [];
    var segments = [];
    for (var i = 0; i < asts.length; i++) {
      var ast = asts[i];
      var type = dialect.getType(ast);
      if (type == myjs.ast.UnquoteExpression && ast['splice']) {
        var part = type.prototype.translate.call(ast, this.translateContext);
        flushBuffer();
        segments.push(part);
      } else {
        buffer.push(dialect.traverse(ast, this));
      }
    }
    flushBuffer();
    if (segments.length == 0) {
      return new myjs.ast.ArrayExpression([]);
    } else {
      var result = segments[0];
      for (var i = 1; i < segments.length; i++) {
        result = new myjs.ast.CallExpression(
          new myjs.ast.MemberExpression(
            result,
            new myjs.ast.Identifier('concat'),
            false),
          [ segments[i] ]);
      }
      return result;
    }
  };

  /**
   * @suppress {checkTypes}
   */
  QuoteVisitor.prototype.visitNode = function(ast, type, dialect) {
    if (type == myjs.ast.UnquoteExpression) {
      return type.prototype.translate.call(ast, this.translateContext);
    } else {
      var self = this;
      var keys = Object.keys(ast);
      var props = [];
      keys.forEach(function(key) {
        props.push(new myjs.ast.ObjectProperty(
          new myjs.ast.Literal(key), dialect.traverse(ast[key], self)));
      });
      return new myjs.ast.ObjectExpression(props);
    }
  };

  QuoteVisitor.prototype.visitPrimitive = function(value, dialect) {
    return new myjs.ast.Literal(value);
  };

  myjs.ast.QuoteExpression.prototype.translate = function(context) {
    var visitor = new QuoteVisitor(context);
    return context.getDialect().traverse(this['value'], visitor);
  };

  goog.exportProperty(myjs.ast.QuoteExpression.prototype, 'translate',
    myjs.ast.QuoteExpression.prototype.translate);

  /**
   * @constructor
   * @extends myjs.ast.Expression
   */
  myjs.ast.UnquoteExpression = function(spliceMarker, value) {
    this['type'] = 'UnquoteExpression';
    this['value'] = value;
    this['splice'] = !!spliceMarker;
  };

  myjs.ast.UnquoteExpression.prototype.translate = function(context) {
    return context.translate(this['value']);
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
    //   -> "," "@"? <PrimaryExpression>
    syntax.getRule('Identifier')
      .addProd(f.punct(','), f.option(f.punctValue('@')),
        f.nonterm('PrimaryExpression'))
      .setConstructor(myjs.ast.UnquoteExpression);

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Quote')
    .setSyntaxProvider(getSyntax)
    .registerType('QuoteExpression', myjs.ast.QuoteExpression)
    .registerType('UnquoteExpression', myjs.ast.UnquoteExpression);

  myjs.registerFragment(fragment);

})();
