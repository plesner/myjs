(function () {

  var ast = myjs.ast;
  var f = myjs.factory;

  function ClassDeclaration(name, parent, body) {
    this.name = name;
    this.parent = parent;
    this.body = body;
  }

  ClassDeclaration.prototype.translate = function () {
    var newParent = this.parent ? this.parent.translate() : null;
    var elements = [];
    var params = [];
    var body = [];
    this.body.forEach(function (part) {
      if (part.isConstructor()) {
        params = part.params;
        body = part.body;
      }
    });
    elements.push(new ast.FunctionDeclaration(this.name, params,
      body));
    this.body.forEach(function (part) {
      if (!part.isConstructor()) {
        elements.push(part.translate(this));
      }
    }.bind(this));
    return elements;
  };

  function PrototypePropertyDefinition(name, params, body) {
    this.name = name;
    this.params = params;
    this.body = body;
  }

  PrototypePropertyDefinition.prototype.translate = function (klass) {
    var fun = new ast.FunctionDeclaration(this.name, this.params, this.body);
    return new ast.ExpressionStatement(
      new ast.AssignmentExpression(
        new ast.GetPropertyExpression(
          new ast.GetPropertyExpression(
            new ast.Identifier(klass.name),
            "prototype"),
          this.name),
        "=",
        fun));
  };

  PrototypePropertyDefinition.prototype.isConstructor = function () {
    return false;
  };

  function Constructor(params, body) {
    this.params = params;
    this.body = body;
  }

  Constructor.prototype.isConstructor = function () {
    return true;
  };

  function getExtensionSyntax() {
    var syntax = new myjs.Syntax();

    // <SourceElement>
    //   -> "class" $Identifier ("extends" <Expression>)? "{" <ClassBody> "}"
    syntax.getRule("SourceElement")
      .addProd(f.keyword("class"), f.value("Identifier"), f.option(
        f.keyword("extends"), f.nonterm("Expression")), f.token("{"),
        f.nonterm("ClassBody"), f.token("}"))
      .setConstructor(ClassDeclaration);

    // <ClassBody>
    //   -> <ClassElement>*
    syntax.getRule("ClassBody")
      .addProd(f.star(f.nonterm("ClassElement")));

    // <ClassElement>
    //   -> <PrototypePropertyDefinition>
    //   -> <Constructor>
    syntax.getRule("ClassElement")
      .addProd(f.nonterm("PrototypePropertyDefinition"))
      .addProd(f.nonterm("Constructor"));

    // <PrototypePropertyDefinition>
    //   -> $Identifier "(" <FormalParameterList> ")" "{" <FunctionBody> "}"
    syntax.getRule("PrototypePropertyDefinition")
      .addProd(f.value("Identifier"), f.token("("),
        f.nonterm("FormalParameterList"), f.token(")"), f.token("{"),
        f.nonterm("FunctionBody"), f.token("}"))
      .setConstructor(PrototypePropertyDefinition);

    syntax.getRule("Constructor")
      .addProd(f.keyword("constructor"), f.token("("),
        f.nonterm("FormalParameterList"), f.token(")"), f.token("{"),
        f.nonterm("FunctionBody"), f.token("}"))
      .setConstructor(Constructor);

    return syntax;
  }

  myjs.registerDialect(new myjs.Dialect("harmony:classes")
    .addExtensionSyntaxProvider(getExtensionSyntax));

})();
