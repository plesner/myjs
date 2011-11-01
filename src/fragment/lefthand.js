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
 * @fileoverview Left-hand-side expressions: calls, members, etc.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

myjs.ast.NewExpression = function(constructor, arguments) {
  this.type = 'NewExpression';
  this.constructor = constructor;
  this.arguments = arguments;
};

myjs.ast.CallExpression = function(callee, arguments) {
  this.type = 'CallExpression';
  this.callee = callee;
  this.arguments = arguments;
};

myjs.ast.MemberExpression = function(object, property, computed) {
  this.type = 'MemberExpression';
  this.object = object;
  this.property = property;
  this.computed = computed;
};

(function () {

  function CallExpressionHandler() { }

  CallExpressionHandler.prototype.unparse = function(context, ast) {
    context.write("(").node(ast.callee).write(")(").nodes(ast.arguments, ",")
      .write(")");
  };

  function MemberExpressionHandler() { }

  MemberExpressionHandler.prototype.unparse = function(context, ast) {
    if (ast.computed) {
      context.write("(").node(ast.object).write(")[").node(ast.property)
        .write("]");
    } else {
      context.write("(").node(ast.object).write(").").node(ast.property);
    }
  };

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <LeftHandSideExpression>
    //   -> "new"* <LeftHandSideAtom> <LeftHandSideSuffix>*
    syntax.getRule('LeftHandSideExpression')
      .addProd(f.star(f.keywordValue('new')), f.nonterm('LeftHandSideAtom'),
        f.star(f.nonterm('LeftHandSideSuffix')))
      .setHandler(buildLeftHandSideExpression);

    function buildLeftHandSideExpression(news, atom, suffixes) {
      var i, current = atom;
      var newCount = news.length;
      // Scan through the suffixes from left to right and apply them
      // appropriately.
      for (i = 0; i < suffixes.length; i++) {
        var suffix = suffixes[i];
        if (suffix.isArguments() && newCount > 0) {
          // If this is argument suffix we match it with a "new" if there is
          // one.
          current = suffix.wrapNew(current);
          newCount--;
        } else {
          // Otherwise we just apply the suffix and keep going.
          current = suffix.wrapPlain(current);
        }
      }
      // Any news that weren't matched by arguments have implicit empty
      // arguments.
      for (i = 0; i < newCount; i++) {
        current = new ArgumentsSuffix([]).wrapNew(current);
      }
      return current;
    }

    // <LeftHandSideAtom>
    //   -> <FunctionExpression>
    //   -> <PrimaryExpression>
    syntax.getRule('LeftHandSideAtom')
      .addProd(f.nonterm('PrimaryExpression'))
      .addProd(f.nonterm('FunctionExpression'));

    // <LeftHandSideSuffix>
    //   -> "[" <Expression> "]"
    //   -> "." $Identifier
    //   -> <Arguments>
    syntax.getRule('LeftHandSideSuffix')
      .addProd(f.punct('['), f.nonterm('Expression'), f.punct(']'))
      .setConstructor(GetElementSuffix)
      .addProd(f.punct('.'), f.value('Identifier'))
      .setConstructor(GetPropertySuffix)
      .addProd(f.nonterm('Arguments'))
      .setConstructor(ArgumentsSuffix);

    function GetElementSuffix(value) {
      this.value = value;
    }

    GetElementSuffix.prototype.isArguments = function() {
      return false;
    };

    GetElementSuffix.prototype.wrapPlain = function(atom) {
      return new myjs.ast.MemberExpression(atom, this.value, true);
    };

    function GetPropertySuffix(name) {
      this.name = name;
    }

    GetPropertySuffix.prototype.isArguments = function() {
      return false;
    };

    GetPropertySuffix.prototype.wrapPlain = function(atom) {
      return new myjs.ast.MemberExpression(atom, new myjs.ast.Identifier(this.name), false);
    };

    function ArgumentsSuffix(args) {
      this.args = args;
    }

    ArgumentsSuffix.prototype.isArguments = function() {
      return true;
    };

    ArgumentsSuffix.prototype.wrapPlain = function(atom) {
      return new myjs.ast.CallExpression(atom, this.args);
    };

    ArgumentsSuffix.prototype.wrapNew = function(atom) {
      return new myjs.ast.NewExpression(atom, this.args);
    };

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.LeftHandSide')
    .setSyntaxProvider(getSyntax)
    .addNodeHandler('CallExpression', new CallExpressionHandler())
    .addNodeHandler('MemberExpression', new MemberExpressionHandler());

  myjs.registerFragment(fragment);

})();