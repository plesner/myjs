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

(function() {

  var f = myjs.factory;

  function SyntaxExpression(rules) {
    this.rules = rules;
  }

  SyntaxExpression.prototype.translate = function() {
    var stmts = [];
    stmts.push(new myjs.ast.VariableStatement([
      new myjs.ast.VariableDeclaration(
        "syntax",
        new myjs.ast.NewExpression(
          new myjs.ast.GetPropertyExpression(
            new myjs.ast.GetPropertyExpression(
              new myjs.ast.Identifier("myjs"),
              "tedir"),
            "LiteralSyntax"
          ),
          []
        )
      )]
    ));
    this.rules.forEach(function(rule) {
      stmts.push(rule.translate());
    });
    stmts.push(new myjs.ast.ReturnStatement(
      new myjs.ast.Literal("syntax")
    ));
    return new myjs.ast.CallExpression(
      new myjs.ast.FunctionExpression(
        null,
        [],
        stmts
      ),
      []
    );
  };

  function RuleDeclaration(name, prods) {
    this.name = name;
    this.prods = prods;
  }

  RuleDeclaration.prototype.translate = function() {
    var rule = new myjs.ast.ExpressionStatement(
      new myjs.ast.CallExpression(
        new myjs.ast.GetPropertyExpression(
          new myjs.ast.Literal("syntax"),
          "getRule"
        ), [
          new myjs.ast.Literal("\"" + this.name + "\"")
        ]
      )
    );
    return rule;
  };

  var INFIX_OPERATORS = ["+:", "*:"];
  var POSTFIX_OPERATORS = ["*", "+", "?"];

  function getExtensionSyntax() {
    var syntax = new myjs.tedir.LiteralSyntax();

    // <PrimaryExpression>
    //   -> "syntax" "{" <RuleDeclaration>* "}"
    syntax.getRule("PrimaryExpression")
      .addProd(f.keyword("syntax"), f.punct("{"),
        f.star(f.nonterm("RuleDeclaration")), f.punct("}"))
      .setConstructor(SyntaxExpression);

    // <RuleDeclaration>
    //   -> "<" $Identifier ">" <Grammar.ProductionDeclaration>* ";"
    syntax.getRule("RuleDeclaration")
      .addProd(f.punct("<"), f.value("Identifier"), f.punct(">"),
        f.star(f.nonterm("Grammar.ProductionDeclaration")), f.punct(";"))
      .setConstructor(RuleDeclaration);

    // <Grammar.ProductionDeclaration>
    //   -> "->" <Grammar.Expression>
    syntax.getRule("Grammar.ProductionDeclaration")
      .addProd(f.punct("->"), f.nonterm("Grammar.Expression"));

    // <Grammar.Expression>
    //   -> <Grammar.SequenceExpression> +: "|"
    syntax.getRule("Grammar.Expression")
      .addProd(f.plus(f.nonterm("Grammar.SequenceExpression"), f.punct("|")));

    // <Grammar.SequenceExpression>
    //   -> <Grammar.InfixExpression>+
    syntax.getRule("Grammar.SequenceExpression")
      .addProd(f.plus(f.nonterm("Grammar.InfixExpression")));

    // <Grammar.InfixExpression>
    //   -> <Grammar.UnaryExpression> +: <Grammar.InfixOperator>
    syntax.getRule("Grammar.InfixExpression")
      .addProd(f.plus(f.nonterm("Grammar.UnaryExpression"),
        f.nonterm("Grammar.InfixOperator")));

    // <Grammar.InfixOperator>
    //   -> ... infix operators ...
    INFIX_OPERATORS.forEach(function(op) {
      syntax.getRule("Grammar.InfixOperator")
        .addProd(f.punctValue(op));
    });

    // <Grammar.UnaryExpression>
    //   -> <Grammar.AtomicExpression> <Grammar.PostfixOperator>*
    syntax.getRule("Grammar.UnaryExpression")
      .addProd(f.nonterm("Grammar.AtomicExpression"), f.star(
        f.nonterm("Grammar.PostfixOperator")));

    // <Grammar.PostfixOperator>
    //   -> ... postfix operators ...
    POSTFIX_OPERATORS.forEach(function(op) {
      syntax.getRule("Grammar.PostfixOperator")
        .addProd(f.punctValue(op));
    });

    // <Grammar.AtomicExpression>
    //   -> "<" $Identifier ">"
    //   -> "$" $Identifier
    //   -> $StringLiteral
    //   -> "(" <Grammar.Expression> ")"
    //   -> "."
    syntax.getRule("Grammar.AtomicExpression")
      .addProd(f.token("<"), f.value("Identifier"), f.token(">"))
      .addProd(f.value("Identifier"))
      .addProd(f.value("StringLiteral"))
      .addProd(f.token("("), f.nonterm("Grammar.Expression"), f.token(")"))
      .addProd(f.token("."));

    return syntax;
  }

  myjs.registerDialect(new myjs.Dialect("tedir/syntax")
    .addExtensionSyntaxProvider(getExtensionSyntax));

}).call(this);
