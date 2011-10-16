(function defineMyJsAst(namespace) { // offset: 0

  namespace.Program = Program;
  function Program(elements) {
    this.elements = elements;
  }

  namespace.FunctionDeclaration = FunctionDeclaration;
  function FunctionDeclaration(name, params, body) {
    this.name = name;
    this.params = params;
    this.body = body;
  }

  namespace.ReturnStatement = ReturnStatement;
  function ReturnStatement(valueOpt) {
    this.value = valueOpt;
  }

  namespace.Block = Block;
  function Block(stmts) {
    this.stmts = stmts;
  }

  namespace.VariableStatement = VariableStatement;
  function VariableStatement(decls) {
    this.decls = decls;
  }

  namespace.VariableDeclaration = VariableDeclaration;
  function VariableDeclaration(name, value) {
    this.name = name;
    this.value = value;
  }

  namespace.IfStatement = IfStatement;
  function IfStatement(cond, thenPart, elsePart) {
    this.cond = cond;
    this.thenPart = thenPart;
    this.elsePart = elsePart;
  }

  namespace.getSource = function () {
    return String(defineMyJsAst);
  };

})(myjs.ast);
