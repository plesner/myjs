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
 * @fileoverview All the operators.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

/**
 * A sequence expression, i.e, a comma-separated sequence of expressions.
 *
 * @param {Array.<myjs.ast.Expression>} expressions the expressions in the
 *   sequence.
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.SequenceExpression = function(expressions) {
  /**
   * "SequenceExpression"
   * @const
   */
  this.type = 'SequenceExpression';

  /**
   * The expressions in the sequence.
   * @type {Array.<myjs.ast.Expression>}
   */
  this.expressions = expressions;
};

/**
 * A unary operator expression.
 *
 * @param {myjs.ast.UnaryOperator} operator the operator.
 * @param {myjs.ast.Expression} argument the argument.
 * @param {boolean} prefix is this a prefix operator?
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.UnaryExpression = function(operator, argument, prefix) {
  /**
   * "UnaryExpression"
   * @const
   */
  this.type = 'UnaryExpression';

  /**
   * The operator.
   * @type {myjs.ast.UnaryOperator}
   */
  this.operator = operator;

  /**
   * The argument.
   * @type {myjs.ast.Expression}
   */
  this.argument = argument;

  /**
   * Is this a prefix operator?
   * @type {boolean}
   */
  this.prefix = prefix;
};

/**
 * A unary operator token.
 *
 * @param {string} token the token.
 * @constructor
 */
myjs.ast.UnaryOperator = function(token) {
  /**
   * "UnaryOperator"
   * @const
   */
  this.type = 'UnaryOperator';

  /**
   * The token.
   * @type {string}
   */
  this.token = token;
};

/**
 * A binary operator expression.
 *
 *
 * @param {myjs.ast.Expression} left the left-hand side argument.
 * @param {myjs.ast.BinaryOperator} operator the operator.
 * @param {myjs.ast.Expression} right the right-hand side argument.
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.BinaryExpression = function(left, operator, right) {
  /**
   * "BinaryExpression"
   * @const
   */
  this.type = 'BinaryExpression';

  /**
   * The left-hand side argument.
   * @type {myjs.ast.Expression}
   */
  this.left = left;

  /**
   * The operator.
   * @type {myjs.ast.BinaryOperator}
   */
  this.operator = operator;

  /**
   * The right-hand side argument.
   * @type {myjs.ast.Expression}
   */
  this.right = right;
};

/**
 * A binary operator token.
 *
 * @param {string} token the token.
 * @constructor
 */
myjs.ast.BinaryOperator = function(token) {
  /**
   * "BinaryOperator"
   * @const
   */
  this.type = 'BinaryOperator';

  /**
   * The token.
   * @type {string}
   */
  this.token = token;
};

/**
 * An assignment operator expression.
 *
 * @param {myjs.ast.Expression} left the left-hand side argument.
 * @param {myjs.ast.AssignmentOperator} operator the operator.
 * @param {myjs.ast.Expression} right the right-hand side argument.
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.AssignmentExpression = function(left, operator, right) {
  /**
   * "AssignmentExpression"
   * @const
   */
  this.type = 'AssignmentExpression';

  /**
   * The left-hand side argument.
   * @type {myjs.ast.Expression}
   */
  this.left = left;

  /**
   * The operator.
   * @type {myjs.ast.AssignmentOperator}
   */
  this.operator = operator;

  /**
   * The right-hand side argument.
   * @type {myjs.ast.Expression}
   */
  this.right = right;
};

/**
 * An assignment operator token.
 *
 * @param {string} token the token.
 * @constructor
 */
myjs.ast.AssignmentOperator = function(token) {
  /**
   * "AssignmentOperator"
   * @const
   */
  this.type = 'AssignmentOperator';

  /**
   * The token.
   * @type {string}
   */
  this.token = token;
};

/**
 * An update (increment or decrement) operator expression.
 *
 * @param {myjs.ast.UpdateOperator} operator the operator.
 * @param {myjs.ast.Expression} argument the argument.
 * @param {boolean} prefix is this a prefix operator?
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.UpdateExpression = function(operator, argument, prefix) {
  /**
   * "UpdateExpression"
   * @const
   */
  this.type = 'UpdateExpression';

  /**
   * The operator.
   * @type {myjs.ast.UpdateOperator}
   */
  this.operator = operator;

  /**
   * The argument.
   * @type {myjs.ast.Expression}
   */
  this.argument = argument;

  /**
   * Is this a prefix operator?
   * @type {boolean}
   */
  this.prefix = prefix;
};

/**
 * An update (increment or decrement) operator token.
 *
 * @param {string} token the token.
 * @constructor
 */
myjs.ast.UpdateOperator = function(token) {
  /**
   * "UpdateOperator"
   * @const
   */
  this.type = 'UpdateOperator';

  /**
   * The token.
   * @type {string}
   */
  this.token = token;
};

/**
 * A logical operator expression.
 *
 * @param {myjs.ast.Expression} left the left-hand side argument.
 * @param {myjs.ast.LogicalOperator} operator the operator.
 * @param {myjs.ast.Expression} right the right-hand side argument.
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.LogicalExpression = function(left, operator, right) {
  /**
   * "LogicalExpression"
   * @const
   */
  this.type = 'LogicalExpression';

  /**
   * The operator.
   * @type {myjs.ast.LogicalOperator}
   */
  this.operator = operator;

  /**
   * The left-hand side argument.
   * @type {myjs.ast.Expression}
   */
  this.left = left;

  /**
   * The right-hand side argument.
   * @type {myjs.ast.Expression}
   */
  this.right = right;
};

/**
 * A logical operator token.
 *
 * @param {string} token the token.
 * @constructor
 */
myjs.ast.LogicalOperator = function(token) {
  /**
   * "LogicalOperator"
   * @const
   */
  this.type = 'LogicalOperator';

  /**
   * The token.
   * @type {string}
   */
  this.token = token;
};

(function() {

  var ASSIGNMENT_OPERATORS = ['=', '+=', '-=', '*=', '&=', '|=', '^=', '%=',
    '>>=', '>>>=', '<<=', '/='];
  var BINARY_OPERATORS = ['==', '!=', '===', '!==', '<', '<=', '>', '>=',
    '<<', '>>', '>>>', '+', '-', '*', '%', '|', '^', '/'];
  var BINARY_KEYWORDS = ['instanceof', 'in'];
  var LOGICAL_OPERATORS = ['||', '&&'];
  var INFIX_KEYWORDS = ['instanceof'];
  var UNARY_OPERATORS = ['-', '+', '!', '~', '!'];
  var UNARY_KEYWORDS = ['typeof', 'void', 'delete'];
  var UPDATE_OPERATORS = ['++', '--'];

  function BinaryHandler() { }

  BinaryHandler.prototype.unparse = function(context) {
    context.write('(').node(this.left).write(')').node(this.operator).write('(')
      .node(this.right).write(')');
  };

  function OperatorHandler() { }

  OperatorHandler.prototype.unparse = function(context) {
    context.write(this.token);
  };

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // Who said higher-order functions weren't useful?
    function infixBuilder(OpBuilder, AstBuilder) {
      return function(op) { // Called during parsing.
        var opAst = new OpBuilder(op);
        return function(left, right) { // Called during post processing.
          return new AstBuilder(left, opAst, right);
        };
      };
    }

    /**
     * Given a list of values, [x0, o0, x1, o1, ..., o_n-1, xn] returns
     * o0(x0, o1(x1, o2(x2, ..., xn))).
     */
    function applyInfixFunctions(items) {
      var i, result = items[items.length - 1];
      for (i = items.length - 3; i >= 0; i -= 2) {
        var next = items[i];
        var op = items[i + 1];
        result = op(next, result);
      }
      return result;
    }

    /**
     * Returns a function that will, given a list of values [x0, x1, ..., xn]
     * returns Cons(x0, Cons(x1, Cons(..., xn))).
     */
    function groupRight(Constructor) {
      return function(items) {
        var i, current = items[items.length - 1];
        for (i = items.length - 2; i >= 0; i--) {
          current = new Constructor(items[i], current);
        }
        return current;
      };
    }

    // <Expression>
    //   -> <AssignmentExpression> +: ","
    syntax.getRule('Expression')
      .addProd(f.plus(f.nonterm('AssignmentExpression'), f.punct(',')))
      .setHandler(groupRight(myjs.ast.SequenceExpression));

    // <AssignmentExpression>
    //   -> <OperatorExpression> +: <AssignmentOperator>
    syntax.getRule('AssignmentExpression')
      .addProd(f.plus(f.nonterm('ConditionalExpression'),
        f.nonterm('AssignmentOperator')))
      .setHandler(applyInfixFunctions);

    // <AssignmentOperator>
    //   -> ... assignment operators ...
    var assignmentBuilder = infixBuilder(myjs.ast.AssignmentOperator,
      myjs.ast.AssignmentExpression);
    ASSIGNMENT_OPERATORS.forEach(function(op) {
      syntax.getRule('AssignmentOperator')
        .addProd(f.punctValue(op))
        .setHandler(assignmentBuilder);
    });

    // <OperatorExpression>
    //   <UnaryExpression> +: <InfixToken>
    syntax.getRule('OperatorExpression')
      .addProd(f.plus(f.nonterm('UnaryExpression'), f.nonterm('InfixToken')))
      .setHandler(applyInfixFunctions);

    // <InfixToken>
    //   -> ... binary operators ...
    //   -> ... binary keywords ...
    var binaryBuilder = infixBuilder(myjs.ast.BinaryOperator,
      myjs.ast.BinaryExpression);
    BINARY_OPERATORS.forEach(function(op) {
      syntax.getRule('InfixToken')
        .addProd(f.punctValue(op))
        .setHandler(binaryBuilder);
    });
    BINARY_KEYWORDS.forEach(function(word) {
      syntax.getRule('InfixToken')
        .addProd(f.keywordValue(word))
        .setHandler(binaryBuilder);
    });
    var logicBuilder = infixBuilder(myjs.ast.LogicalOperator,
      myjs.ast.LogicalExpression);
    LOGICAL_OPERATORS.forEach(function(op) {
      syntax.getRule('InfixToken')
        .addProd(f.punctValue(op))
        .setHandler(logicBuilder);
    });
    INFIX_KEYWORDS.forEach(function(word) {
      syntax.getRule('InfixToken')
        .addProd(f.keywordValue(word));
    });

    // <UnaryExpression>
    //   -> <PrefixToken>* <LeftHandSideExpression> <PostfixOperator>*
    syntax.getRule('UnaryExpression')
      .addProd(f.star(f.nonterm('PrefixToken')),
        f.nonterm('LeftHandSideExpression'),
        f.star(f.nonterm('PostfixOperator')))
      .setHandler(buildUnary);

    function buildUnary(prefix, value, postfix) {
      var i, current = value;
      for (i = 0; i < postfix.length; i++) {
        current = postfix[i](current, false);
      }
      for (i = prefix.length - 1; i >= 0; i--) {
        current = prefix[i](current, true);
      }
      return current;
    }

    function unaryBuilder(OpBuilder, AstBuilder) {
      return function(op) {
        var opAst = new OpBuilder(op);
        return function(value, isPrefix) {
          return new AstBuilder(opAst, value, isPrefix);
        };
      };
    }

    // <PrefixToken>
    //   -> ... update operators ...
    //   -> ... unary keywords ...
    //   -> ... unary operators ...
    var updateBuilder = unaryBuilder(myjs.ast.UpdateOperator,
      myjs.ast.UpdateExpression);
    UPDATE_OPERATORS.forEach(function(op) {
      syntax.getRule('PrefixToken')
        .addProd(f.punctValue(op))
        .setHandler(updateBuilder);
    });
    var unaryBuilder = unaryBuilder(myjs.ast.UnaryOperator,
      myjs.ast.UnaryExpression);
    UNARY_KEYWORDS.forEach(function(word) {
      syntax.getRule('PrefixToken')
        .addProd(f.keywordValue(word))
        .setHandler(unaryBuilder);
    });
    UNARY_OPERATORS.forEach(function(op) {
      syntax.getRule('PrefixToken')
        .addProd(f.punctValue(op))
        .setHandler(unaryBuilder);
    });

    // <PostfixOperator>
    //   -> ... update operators ...
    UPDATE_OPERATORS.forEach(function(op) {
      syntax.getRule('PostfixOperator')
        .addProd(f.punctValue(op))
        .setHandler(updateBuilder);
    });

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Operators')
    .setSyntaxProvider(getSyntax)
    .registerType('AssignmentExpression', BinaryHandler)
    .registerType('AssignmentOperator', OperatorHandler)
    .registerType('BinaryExpression', BinaryHandler)
    .registerType('BinaryOperator', OperatorHandler)
    .registerType('LogicalExpression', BinaryHandler)
    .registerType('LogicalOperator', OperatorHandler);

  myjs.registerFragment(fragment);

})();
