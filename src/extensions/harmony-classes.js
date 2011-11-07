/**
 * @constructor
 */
function ClassDeclaration(name) {
  this['type'] = 'ClassDeclaration';
  this['name'] = name;
}

ClassDeclaration.prototype.translate = function(context) {
  return new myjs.ast.FunctionDeclaration(this['name'], [],
    new myjs.ast.BlockStatement([]));
};

function getSyntax() {

  // Build the syntax
  var f = myjs.factory;
  var syntax = myjs.Syntax.create();

  // <SourceElement>
  //   -> <ClassDeclaration>
  syntax.getRule('SourceElement')
    .addProd(f.nonterm('ClassDeclaration'));

  // <ClassDeclaration>
  //   -> "class" <Identifier> "{" <ClassElement>* "}"
  syntax.getRule('ClassDeclaration')
    .addProd(f.keyword('class'), f.nonterm('Identifier'), f.punct('{'),
      f.star(f.nonterm('ClassElement')), f.punct('}'))
    .setConstructor(ClassDeclaration);

  // <ClassElement>
  //   -> <Constructor>
  syntax.getRule('ClassElement')
    .addProd(f.nonterm('Constructor'));

  // <Constructor>
  //   -> "constructor" "(" <FormalParameterList> ")" "{"
  //      <ConstructorElement>* "}"
  syntax.getRule('Constructor')
    .addProd(f.keyword('constructor'), f.punct('('),
      f.nonterm('FormalParameterList'), f.punct(')'), f.punct('{'),
      f.star(f.nonterm('ConstructorElement')), f.punct('}'));

  // <ConstructorElement>
  //   -> <SourceElement>
  //   -> <InstancePropertyDefinition>
  syntax.getRule('ConstructorElement')
    .addProd(f.nonterm('SourceElement'))
    .addProd(f.nonterm('InstancePropertyDefinition'));

  // <InstancePropertyDefinition>
  //   -> "public" <ExportableDefinition>
  syntax.getRule('InstancePropertyDefinition')
    .addProd(f.keyword('public'), f.nonterm('ExportableDefinition'));

  // <ExportableDefinition>
  //   -> <FunctionDeclaration>
  syntax.getRule('ExportableDefinition')
    .addProd(f.nonterm('FunctionDeclaration'));

  return syntax;

}

// Register this language extension with myjs.
myjs.registerFragment(new myjs.Fragment('harmony.Classes')
  .setSyntaxProvider(getSyntax)
  .registerType('ClassDeclaration', ClassDeclaration));
