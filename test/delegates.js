// Bound expression syntax tree node.
function BoundMethodExpression(atom, name) {
  this.type = 'BoundMethodExpression';
  this.atom = atom;
  this.name = name;
}

BoundMethodExpression.prototype.translate = function(context) {
  return `((function(temp) {
    return temp.,(context.translate(this.name)).bind(temp);
  })(,(context.translate(this.atom))));
};

// Unbound method syntax tree node.
function UnboundMethodExpression(name) {
  this.type = 'UnboundMethodExpression';
  this.name = name;
}

UnboundMethodExpression.prototype.translate = function(context) {
  return `(function(recv, var_args) {
    return recv.,(context.translate(this.name)).apply(recv, Array.prototype.splice.call(arguments, 1));
  });
};

function getSyntax() {

  // Suffix syntax tree builder helper.
  function BoundMethodSuffix(name) {
    this.name = name;
  }

  // Apply this suffix to a base expression.
  BoundMethodSuffix.prototype.apply = function(atom) {
    return new BoundMethodExpression(atom, this.name);
  };

  // Build the syntax
  var f = myjs.factory;
  var syntax = myjs.Syntax.create();

  syntax.getRule('LeftHandSideSuffix')
    .addProd(f.punct('::'), f.nonterm('Identifier'))
    .setConstructor(BoundMethodSuffix);

  syntax.getRule('PrimaryExpression')
    .addProd(f.punct('::'), f.nonterm('Identifier'))
    .setConstructor(UnboundMethodExpression);

  return syntax;
}

// Register this language extension with myjs.
myjs.registerFragment(new myjs.Fragment('demo.Delegates')
  .setSyntaxProvider(getSyntax)
  .registerType('BoundMethodExpression', BoundMethodExpression)
  .registerType('UnboundMethodExpression', UnboundMethodExpression));
