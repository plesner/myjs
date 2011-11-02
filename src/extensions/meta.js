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

(function () {

  myjs.ast.QuoteExpression = function(value) {
    this.type = 'QuoteExpression';
    this.value = value;
  };

  function unparseQuoted(context, value) {
    if (value.type) {
      if (value.type == 'UnquoteExpression') {
        context.write('{"type":"Literal","value":(').node(value.value).write(')}');
      } else {
        var first = true;
        context.write('{');
        Object.keys(value).forEach(function(key) {
          if (first) {
            first = false;
          } else {
            context.write(',');
          }
          unparseQuoted(context, key);
          context.write(':');
          unparseQuoted(context, value[key]);
        });
        context.write('}');
      }
    } else {
      context.write(JSON.stringify(value));
    }
  }

  myjs.ast.QuoteExpression.prototype.unparse = function(context) {
    unparseQuoted(context, this.value);
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
    //   -> "," <PrimaryExpression>
    syntax.getRule('PrimaryExpression')
      .addProd(f.punct('`'), f.nonterm('PrimaryExpression'))
      .setConstructor(myjs.ast.QuoteExpression)
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
