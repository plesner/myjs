(function () {

  var f = tedir.factory;

  function getExtensionSyntax() {
    var syntax = new tedir.Syntax();

    // <SourceElement>
    //   -> "class" $Identifier ("extends" <Expression>)? "{" "}"
    syntax.getRule("SourceElement")
      .addProd(f.keyword("class"), f.value("Identifier"), f.option(
        f.keyword("extends"), f.nonterm("Expression")), f.token("{"),
        f.token("}"));

    return syntax;
  }

  myjs.registerDialect(new myjs.Dialect("classes")
    .addExtensionSyntaxProvider(getExtensionSyntax));

})();
