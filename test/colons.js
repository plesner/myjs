// Syntax tree node.
function ColonExpression(atom, name) {
  this.type = 'ColonExpression';
  this.atom = atom;
  this.name = name;
}

ColonExpression.prototype.translate = function(dialect, recurse) {
  return `((function(temp) {
    return temp.,(this.name).bind(temp);
  })(,(this.atom)));
};

function getSyntax() {

  // Suffix syntax tree builder helper.
  function ColonSuffix(name) {
    this.name = name;
  }

  ColonSuffix.prototype.apply = function(atom) {
    return new ColonExpression(atom, this.name);
  };

  // Build the syntax
  var f = myjs.factory;
  var syntax = myjs.Syntax.create();

  syntax.getRule('LeftHandSideSuffix')
    .addProd(f.punct('::'), f.nonterm('Identifier'))
    .setConstructor(ColonSuffix);

  return syntax;
}

myjs.registerFragment(new myjs.Fragment('demo.Colons')
  .setSyntaxProvider(getSyntax)
  .registerType('ColonExpression', ColonExpression));
