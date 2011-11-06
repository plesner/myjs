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
 * @fileoverview Core productions.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

/**
 * An identifier.
 *
 * @param {string} name the identifier's name.
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.Identifier = function(name) {
  this['type'] = 'Identifier';
  this['name'] = name;
};

/**
 * @inheritDoc
 */
myjs.ast.Identifier.prototype.unparse = function(context) {
 context.write(this['name']);
};

/**
 * A literal value.
 *
 * @param {*} value the literal value.
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.Literal = function(value) {
  this['type'] = 'Literal';
  this['value'] = value;
};

/**
 * @inheritDoc
 */
myjs.ast.Literal.prototype.unparse = function(context) {
  context.write(JSON.stringify(this['value']));
};

(function() {

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <Identifier>
    //   -> $Identifier
    syntax.getRule('Identifier')
      .addProd(f.value('Identifier'))
      .setConstructor(myjs.ast.Identifier);

    // <Literal>
    //   -> <NumericLiteral>
    //   -> <StringLiteral>
    //   -> <RegularExpressionLiteral>
    //   -> <BooleanLiteral>
    syntax.getRule('Literal')
      .addProd(f.nonterm('NumericLiteral'))
      .addProd(f.nonterm('StringLiteral'))
      .addProd(f.nonterm('RegularExpressionLiteral'))
      .addProd(f.nonterm('BooleanLiteral'));

    /**
     * Strips the delimiters off a string.
     */
    function stripString(str) {
      return str.substring(1, str.length - 1);
    }

    /**
     * Returns a function that first converts its argument using the given
     * converter and then wraps the result in a literal.
     */
    function convertLiteral(converter) {
      return function(token) {
        return new myjs.ast.Literal(converter(token));
      };
    }

    // <StringLiteral>
    //   -> $StringLiteral
    syntax.getRule('StringLiteral')
      .addProd(f.value('StringLiteral'))
      .setConstructor(convertLiteral(stripString));

    // <NumericLiteral>
    //   -> $NumericLiteral
    syntax.getRule('NumericLiteral')
      .addProd(f.value('NumericLiteral'))
      .setConstructor(convertLiteral(Number));

    // <BooleanLiteral>
    //   -> "true"
    //   -> "false"
    syntax.getRule('BooleanLiteral')
      .addProd(f.keyword('true'))
      .setHandler(function() { return new myjs.ast.Literal(true); })
      .addProd(f.keyword('false'))
      .setConstructor(function() { return new myjs.ast.Literal(false); });

    /**
     * Custom expression used to parse regular expressions.
     *
     * @constructor
     * @extends myjs.tedir.CustomHandler
     */
    function RegExpHandler() { }
    goog.inherits(RegExpHandler, myjs.tedir.CustomHandler);

    RegExpHandler.prototype.parse = function(context) {
      var input = context.getTokenStream();
      input.rewindEther();
      var exprTokens = [];
      var flags = '';
      var current = input.getCurrent().value;
      // Scan forward until we meet the end of the input or a "/".
      while (input.hasMore() && (current != '/')) {
        exprTokens.push(current);
        input.advanceSoft();
        current = input.getCurrent().value;
      }
      if (input.hasMore()) {
        input.advanceSoft();
        if (input.hasMore() && input.getCurrent().type == 'Identifier') {
          flags = input.getCurrent().value;
          input.advanceSoft();
        }
      } else {
        return context.getErrorMarker();
      }
      var expr = exprTokens.join('');
      input.skipEther();
      return [expr, flags];
    };

    function wrapRegExp(args) {
      return new myjs.ast.Literal(RegExp(args[0], args[1]));
    }

    // <RegularExpressionLiteral>
    //   -> "/" [<RegularExpressionBody> "/" RegularExpressionFlags]
    syntax.getRule('RegularExpressionLiteral')
      .addProd(f.token('/'), f.custom(new RegExpHandler()))
      .setHandler(wrapRegExp);

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Core')
    .setSyntaxProvider(getSyntax)
    .registerType('Identifier', myjs.ast.Identifier)
    .registerType('Literal', myjs.ast.Literal);

  myjs.registerFragment(fragment);

})();
