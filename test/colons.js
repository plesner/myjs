// Colon expression syntax tree node.
function ColonExpression(atom, name) {
  this.type = 'ColonExpression';
  this.atom = atom;
  this.name = name;
}

// Translate into plain js.
ColonExpression.prototype.translate = function(dialect, recurse) {
  return `((function(temp) {
    return temp.,(recurse(this.name)).bind(temp);
  })(,(recurse(this.atom))));
};

function getSyntax() {

  // Suffix syntax tree builder helper.
  function ColonSuffix(name) {
    this.name = name;
  }

  // Apply this suffix to a base expression.
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

// Register this language extension with myjs.
myjs.registerFragment(new myjs.Fragment('demo.Colons')
  .setSyntaxProvider(getSyntax)
  .registerType('ColonExpression', ColonExpression));
