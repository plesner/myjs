(function () {

  var f = myjs.factory;

  function getExtensionSyntax() {
    var syntax = new myjs.Syntax();

    // <SourceElement>
    //   -> "class" $Identifier ("extends" <Expression>)? "{" <ClassBody> "}"
    syntax.getRule("SourceElement")
      .addProd(f.keyword("class"), f.value("Identifier"), f.option(
        f.keyword("extends"), f.nonterm("Expression")), f.token("{"),
        f.nonterm("ClassBody"), f.token("}"));

    // <ClassBody>
    //   -> <ClassElement>*
    syntax.getRule("ClassBody")
      .addProd(f.star(f.nonterm("ClassElement")));

    // <ClassElement>
    //   -> <PrototypePropertyDefinition>
    syntax.getRule("ClassElement")
      .addProd(f.nonterm("PrototypePropertyDefinition"));

    // <PrototypePropertyDefinition>
    //   -> $Identifier "(" <FormalParameterList> ")" "{" <FunctionBody> "}"
    syntax.getRule("PrototypePropertyDefinition")
      .addProd(f.value("Identifier"), f.token("("),
        f.nonterm("FormalParameterList"), f.token(")"), f.token("{"),
        f.nonterm("FunctionBody"), f.token("}"));

    return syntax;
  }

  myjs.registerDialect(new myjs.Dialect("harmony:classes")
    .addExtensionSyntaxProvider(getExtensionSyntax));

})();
