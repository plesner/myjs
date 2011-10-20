(function () {

  var ast = myjs.ast;
  var f = myjs.factory;

  function SyntaxExpression(rules) {
    this.rules = rules;
  }

  SyntaxExpression.prototype.translate = function () {
    var stmts = [];
    stmts.push(new ast.VariableStatement([
      new ast.VariableDeclaration(
        "syntax",
        new ast.NewExpression(
          new ast.GetPropertyExpression(
            new ast.Identifier("tedir"),
            "Syntax"
          ),
          []
        )
      )]
    ));
    this.rules.forEach(function (rule) {
      stmts.push(rule.translate());
    });
    stmts.push(new ast.ReturnStatement(
      new ast.Literal("syntax")
    ));
    return new ast.CallExpression(
      new ast.FunctionExpression(
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

  RuleDeclaration.prototype.translate = function () {
    var rule = new ast.ExpressionStatement(
      new ast.CallExpression(
        new ast.GetPropertyExpression(
          new ast.Literal("syntax"),
          "getRule"
        ), [
          new ast.Literal("\"" + this.name + "\"")
        ]
      )
    );
    return rule;
  };

  function getExtensionSyntax() {
    var syntax = new myjs.Syntax();

    // <PrimaryExpression>
    //   -> "syntax" "{" <RuleDeclaration>* "}"
    syntax.getRule("PrimaryExpression")
      .addProd(f.keyword("syntax"), f.token("{"),
        f.star(f.nonterm("RuleDeclaration")), f.token("}"))
      .setConstructor(SyntaxExpression);

    // <RuleDeclaration>
    //   -> "<" $Identifier ">" <Grammar.ProductionDeclaration>* ";"
    syntax.getRule("RuleDeclaration")
      .addProd(f.token("<"), f.value("Identifier"), f.token(">"),
        f.star(f.nonterm("Grammar.ProductionDeclaration")), f.token(";"))
      .setConstructor(RuleDeclaration);

    // <Grammar.ProductionDeclaration>
    //   -> "--" <Grammar.Expression>
    syntax.getRule("Grammar.ProductionDeclaration")
      .addProd(f.token("--"), f.nonterm("Grammar.Expression"));

    // <Grammar.Expression>
    //   -> <Grammar.SequenceExpression> +: "|"
    syntax.getRule("Grammar.Expression")
      .addProd(f.plus(f.nonterm("Grammar.SequenceExpression"), f.token("|")));

    // <Grammar.SequenceExpression>
    //   -> <Grammar.InfixExpression>+
    syntax.getRule("Grammar.SequenceExpression")
      .addProd(f.plus(f.nonterm("Grammar.InfixExpression")));

    // <Grammar.InfixExpression>
    //   -> <Grammar.AtomicExpression> +: <Grammar.InfixOperator>
    syntax.getRule("Grammar.InfixExpression")
      .addProd(f.plus(f.nonterm("Grammar.AtomicExpression"),
        f.nonterm("Grammar.InfixOperator")));

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

  myjs.registerDialect(new myjs.Dialect("tedir/grammar")
    .addExtensionSyntaxProvider(getExtensionSyntax));

})();
