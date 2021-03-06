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

/**
 * A new expression.
 *
 * @param {myjs.ast.Expression} constructor the constructor function.
 * @param {Array.<myjs.ast.Expression>} args the constructor arguments.
 * @constructor
 * @extends myjs.ast.Expression
 * @suppress {checkTypes}
 */
myjs.ast.NewExpression = function(constructor, args) {
  this['type'] = 'NewExpression';
  this['constructor'] = constructor;
  this['arguments'] = args;
};

/**
 * @inheritDoc
 * @suppress {checkTypes}
 */
myjs.ast.NewExpression.prototype.unparse = function(context) {
  context.write('new (').node(this['constructor']).write(')(')
    .nodes(this['arguments'], ', ').write(')');
};

/**
 * A function or method call expression.
 *
 * @param {myjs.ast.Expression} callee the object being called.
 * @param {Array.<myjs.ast.Expression>} args the call arguments.
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.CallExpression = function(callee, args) {
  this['type'] = 'CallExpression';
  this['callee'] = callee;
  this['arguments'] = args;
};

/**
 * @inheritDoc
 */
myjs.ast.CallExpression.prototype.unparse = function(context) {
  context.write('(').node(this['callee']).write(')(')
    .nodes(this['arguments'], ', ').write(')');
};

/**
 * A member expression.
 *
 * @param {myjs.ast.Expression} object the object being accessed.
 * @param {myjs.ast.Identifier|myjs.ast.Expression} property the property.
 * @param {boolean} computed is this 'o[p]' or 'o.p' access?
 * @constructor
 * @extends myjs.ast.Expression
 */
myjs.ast.MemberExpression = function(object, property, computed) {
  this['type'] = 'MemberExpression';
  this['object'] = object;
  this['property'] = property;
  this['computed'] = computed;
};

/**
 * @inheritDoc
 */
myjs.ast.MemberExpression.prototype.unparse = function(context) {
  if (this['computed']) {
    context.write('(').node(this['object']).write(')[').node(this['property'])
      .write(']');
  } else {
    context.write('(').node(this['object']).write(').').node(this['property']);
  }
};

/**
 * An expression suffix that can later, when passed the atom it is a
 * suffix of, create the full expression.
 *
 * @interface
 */
myjs.ast.LeftHandSuffix = function() { };

goog.exportSymbol('myjs.ast.LeftHandSuffix', myjs.ast.LeftHandSuffix);

/**
 * Applies this suffix to an atom, returning the full syntax tree for
 * this expression.
 *
 * @param {myjs.ast.Expression} atom the atom to wrap.
 * @return {myjs.ast.Expression} the full wrapped expression.
 */
myjs.ast.LeftHandSuffix.prototype.apply = goog.abstractMethod;

goog.exportProperty(myjs.ast.LeftHandSuffix.prototype, 'apply',
  myjs.ast.LeftHandSuffix.prototype.apply);

(function() {

  function getSyntax() {

    /**
     * @constructor
     * @implements myjs.ast.LeftHandSuffix
     */
    function GetElementSuffix(value) {
      this.value = value;
    }

    GetElementSuffix.prototype.apply = function(atom) {
      return new myjs.ast.MemberExpression(atom, this.value, true);
    };

    goog.exportProperty(GetElementSuffix.prototype, 'apply',
      GetElementSuffix.prototype.apply);

    /**
     * @constructor
     * @implements myjs.ast.LeftHandSuffix
     */
    function GetPropertySuffix(name) {
      this.name = name;
    }

    GetPropertySuffix.prototype.apply = function(atom) {
      return new myjs.ast.MemberExpression(atom, this.name, false);
    };

    goog.exportProperty(GetPropertySuffix.prototype, 'apply',
      GetPropertySuffix.prototype.apply);

    /**
     * @constructor
     * @implements myjs.ast.LeftHandSuffix
     */
    function ArgumentsSuffix(args) {
      this.args = args;
    }

    ArgumentsSuffix.prototype.legalNewSuffix = true;

    ArgumentsSuffix.prototype.apply = function(atom) {
      return new myjs.ast.CallExpression(atom, this.args);
    };

    goog.exportProperty(ArgumentsSuffix.prototype, 'apply',
      ArgumentsSuffix.prototype.apply);

    ArgumentsSuffix.prototype.applyNew = function(atom) {
      return new myjs.ast.NewExpression(atom, this.args);
    };

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
        if (suffix.legalNewSuffix && newCount > 0) {
          // If this is argument suffix we match it with a "new" if there is
          // one.
          current = suffix.applyNew(current);
          newCount--;
        } else {
          // Otherwise we just apply the suffix and keep going.
          current = suffix['apply'](current);
        }
      }
      // Any news that weren't matched by arguments have implicit empty
      // arguments.
      for (i = 0; i < newCount; i++) {
        current = new ArgumentsSuffix([]).applyNew(current);
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
    //   -> "." <Identifier>
    //   -> <Arguments>
    syntax.getRule('LeftHandSideSuffix')
      .addProd(f.punct('['), f.nonterm('Expression'), f.punct(']'))
      .setConstructor(GetElementSuffix)
      .addProd(f.punct('.'), f.nonterm('Identifier'))
      .setConstructor(GetPropertySuffix)
      .addProd(f.nonterm('Arguments'))
      .setConstructor(ArgumentsSuffix);

    // <Arguments>
    //   -> "(" <AssignmentExpression> *: "," ")"
    syntax.getRule('Arguments')
      .addProd(f.punct('('), f.star(f.nonterm('AssignmentExpression'),
        f.punct(',')), f.punct(')'));

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.LeftHandSide')
    .setSyntaxProvider(getSyntax)
    .registerType('CallExpression', myjs.ast.CallExpression)
    .registerType('MemberExpression', myjs.ast.MemberExpression)
    .registerType('NewExpression', myjs.ast.NewExpression);

  myjs.registerFragment(fragment);

})();
