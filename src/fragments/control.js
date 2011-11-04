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
 * @fileoverview Basic non-looping control structures.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

/**
 * A return statement.
 *
 * @param {?myjs.ast.Expression} argument optional return value.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.ReturnStatement = function(argument) {
  this.type = 'ReturnStatement';
  this.argument = argument;
};

/**
 * @inheritDoc
 */
myjs.ast.ReturnStatement.prototype.unparse = function(context) {
  context.write('return');
  if (this.argument) {
    context.write(' ').node(this.argument);
  }
  context.write(';').newline();
};

/**
 * An if statement.
 *
 * @param {myjs.ast.Expression} test the if test.
 * @param {myjs.ast.Statement} consequent then-part.
 * @param {myjs.ast.Statement=} opt_alternate optional else-part.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.IfStatement = function(test, consequent, opt_alternate) {
  this.type = 'IfStatement';
  this.test = test;
  this.consequent = consequent;
  this.alternate = opt_alternate || null;
};

/**
 * @inheritDoc
 */
myjs.ast.IfStatement.prototype.unparse = function(context) {
  context.write('if (').node(this.test).write(') ').node(this.consequent);
  if (this.alternate) {
    context.write(' else ').node(this.alternate);
  }
};

/**
 * Labeled statement.
 *
 * @param {myjs.ast.Identifier} label the label.
 * @param {myjs.ast.Statement} body the statement body.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.LabeledStatement = function(label, body) {
  this.type = 'LabeledStatement';
  this.label = label;
  this.body = body;
};

/**
 * A break statement.
 *
 * @param {?myjs.ast.Identifier} label the label to break from.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.BreakStatement = function(label) {
  this.type = 'BreakStatement';
  this.label = label;
};

/**
 * A continue statement.
 *
 * @param {?myjs.ast.Identifier} label the label to continue from.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.ContinueStatement = function(label) {
  this.type = 'ContinueStatement';
  this.label = label;
};

/**
 * A switch statement.
 *
 * @param {myjs.ast.Expression} discriminant the expression to switch on.
 * @param {Array.<myjs.ast.SwitchCase>} cases the switch cases.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.SwitchStatement = function(discriminant, cases) {
  this.type = 'SwitchStatement';
  this.discriminant = discriminant;
  this.cases = cases;
};

/**
 * A switch case.
 *
 * @param {?myjs.ast.Expression} test the test expression or null for default.
 * @param {myjs.ast.Statement} consequent the body statement.
 * @constructor
 * @extends myjs.ast.Statement
 */
myjs.ast.SwitchCase = function(test, consequent) {
  this.type = 'SwitchCase';
  this.test = test;
  this.consequent = consequent;
};

(function() {

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <Statement>
    //   -> <IfStatement>
    //   -> <ReturnStatement>
    //   -> <BreakStatement>
    //   -> <ContinueStatement>
    //   -> <SwitchStatement>
    syntax.getRule('Statement')
      .addProd(f.nonterm('IfStatement'))
      .addProd(f.nonterm('ReturnStatement'))
      .addProd(f.nonterm('BreakStatement'))
      .addProd(f.nonterm('ContinueStatement'))
      .addProd(f.nonterm('SwitchStatement'));

    // <ReturnStatement>
    //   -> "return" <Expression>? ";"
    syntax.getRule('ReturnStatement')
      .addProd(f.keyword('return'), f.option(f.nonterm('Expression')),
        f.punct(';'))
      .setConstructor(myjs.ast.ReturnStatement);

    // <BreakStatement>
    //   -> "break" <Identifier>? ";"
    syntax.getRule('BreakStatement')
      .addProd(f.keyword('break'), f.option(f.nonterm('Identifier')),
        f.punct(';'))
      .setConstructor(myjs.ast.BreakStatement);

    // <ContinueStatement>
    //   -> "continue" <Identifier>? ";"
    syntax.getRule('ContinueStatement')
      .addProd(f.keyword('continue'), f.option(f.nonterm('Identifier')),
        f.punct(';'))
      .setConstructor(myjs.ast.ContinueStatement);

    // <IfStatement>
    //   -> "if" "(" <Expression> ")" <Statement> ("else" <Statement>)?
    syntax.getRule('IfStatement')
      .addProd(f.keyword('if'), f.punct('('), f.nonterm('Expression'),
        f.punct(')'), f.nonterm('Statement'), f.option(f.keyword('else'),
        f.nonterm('Statement')))
      .setConstructor(myjs.ast.IfStatement);

    // <SwitchStatement>
    //   -> "switch" "(" <Expression> ")" <CaseBlock>
    syntax.getRule('SwitchStatement')
      .addProd(f.keyword('switch'), f.punct('('), f.nonterm('Expression'),
        f.punct(')'), f.nonterm('CaseBlock'))
      .setConstructor(myjs.ast.SwitchStatement);

    // <CaseBlock>
    //   -> "{" (<CaseClause>|<DefaultClause>)* "}"
    syntax.getRule('CaseBlock')
      .addProd(f.punct('{'), f.star(f.choice(f.nonterm('CaseClause'),
        f.nonterm('DefaultClause'))), f.punct('}'));

    // <CaseClause>
    //   -> "case" <Expression> ":" <Statement>*
    syntax.getRule('CaseClause')
      .addProd(f.keyword('case'), f.nonterm('Expression'), f.punct(':'),
        f.star(f.nonterm('Statement')))
      .setConstructor(myjs.ast.SwitchCase);

    // <DefaultClause>
    //   // -> "default" ":" <Statement>*
    syntax.getRule('DefaultClause')
      .addProd(f.keyword('default'), f.punct(':'),
        f.star(f.nonterm('Statement')))
      .setHandler(buildDefaultCase);

    function buildDefaultCase(body) {
      return new myjs.ast.SwitchCase(null, body);
    }

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Control')
    .setSyntaxProvider(getSyntax)
    .registerType('ReturnStatement', myjs.ast.ReturnStatement)
    .registerType('IfStatement', myjs.ast.IfStatement);

  myjs.registerFragment(fragment);

})();
