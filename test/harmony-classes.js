/**
 * @constructor
 */
function ClassDeclaration(name, elements) {
  this.type = 'ClassDeclaration';
  this.name = name;
  this.elements = elements;
}

ClassDeclaration.prototype.translate = function(context) {
  var cons = this.getConstructor();
  return #SourceElement(
    var ,(this.name) = (function () {
      function ,(this.name)(,@(cons.getParameters())) {
        ,@(cons.translate(context))
      };
      ,@(this.translatePrototypeProperties(context))
      ,@(this.translateConstructorProperties(context))
      return ,(this.name);
    })();
  )
};

ClassDeclaration.prototype.getConstructor = function() {
  for (var i = 0; i < this.elements.length; i++) {
    var elm = this.elements[i];
    if (elm.type == 'Constructor') {
      return elm;
    }
  }
  return Constructor.MIRANDA;
};

ClassDeclaration.prototype.translatePrototypeProperties = function(context) {
  var result = [];
  var className = this.name;
  this.elements.forEach(function(elm) {
    if (elm.type == 'MethodDefinition') {
      var holder = #Expression(,className.prototype);
      result = result.concat(elm.translateAll(holder, context));
    }
  });
  return result;
};

ClassDeclaration.prototype.translateConstructorProperties = function(context) {
  var result = [];
  var className = this.name;
  this.elements.forEach(function(elm) {
    if (elm.type == 'MemberVariableDefinition') {
      var holder = #Expression(,className);
      result = result.concat(elm.translateAll(holder, context));
    }
  });
  return result;
};

function MemberVariableDefinition(decl) {
  this.type = 'MemberVariableDefinition';
  this.decl = decl;
}

MemberVariableDefinition.prototype.translateAll = function(holder, context) {
  var decls = this.decl.declarations;
  return decls.map(function(decl) {
    var name = decl.id.name;
    var init = decl.init;
    return #ExpressionStatement(,holder.,name = ,init;);
  });
};

function Constructor(params, body) {
  this.type = 'Constructor';
  this.params = params;
  this.body = body;
}

Constructor.MIRANDA = new Constructor([], []);

Constructor.prototype.getParameters = function() {
  return this.params;
};

Constructor.prototype.translate = function(context) {
  var stmts = [];
  this.body.forEach(function(elm) {
    var holder = #Expression(this);
    stmts = stmts.concat(elm.translateAll(holder, context));
  });
  return #Block({,@stmts});
};

function MethodDefinition(id, params, body) {
  this.type = 'MethodDefinition';
  this.id = id;
  this.params = params;
  this.body = body;
}

MethodDefinition.prototype.translateAll = function(holder, context) {
  var result = #ExpressionStatement(
    ,holder.,(this.id) = function (,@(this.params)) {
      ,(this.body);
    }
  );
  return [result];
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
    .addProd(f.nonterm('Constructor'))
    .addProd(f.nonterm('PrototypePropertyDefinition'));

  // <Constructor>
  //   -> "constructor" "(" <FormalParameterList> ")" "{"
  //      <ConstructorElement>* "}"
  syntax.getRule('Constructor')
    .addProd(f.keyword('constructor'), f.punct('('),
      f.nonterm('FormalParameterList'), f.punct(')'), f.punct('{'),
      f.star(f.nonterm('ConstructorElement')), f.punct('}'))
    .setConstructor(Constructor);

  // <ConstructorElement>
  //   -> <SourceElement>
  //   -> <InstancePropertyDefinition>
  syntax.getRule('ConstructorElement')
    .addProd(f.nonterm('SourceElement'))
    .addProd(f.nonterm('InstancePropertyDefinition'));

  // <PrototypePropertyDefinition>
  //   -> <MethodDefinition>
  syntax.getRule('PrototypePropertyDefinition')
    .addProd(f.nonterm('MethodDefinition'))
    .addProd(f.nonterm('MemberVariableDefinition'));

  // <MethodDefinition>
  //   -> <Identifier> "(" <FormalParameterList> ")" "{" <FunctionBody> "}"
  syntax.getRule('MethodDefinition')
    .addProd(f.nonterm("Identifier"), f.punct("("),
      f.nonterm('FormalParameterList'), f.punct(")"), f.punct('{'),
      f.star(f.nonterm('ConstructorElement')), f.punct('}'))
    .setConstructor(MethodDefinition);

  // <InstancePropertyDefinition>
  //   -> "public" <ExportableDefinition>
  syntax.getRule('InstancePropertyDefinition')
    .addProd(f.keyword('public'), f.nonterm('ExportableDefinition'));

  // <MemberVariableDefinition>
  //   -> <VariableDeclarationList> ";"
  syntax.getRule('MemberVariableDefinition')
    .addProd(f.nonterm('VariableDeclarationList'), f.punct(';'))
    .setConstructor(MemberVariableDefinition);

  // <ExportableDefinition>
  //   -> <FunctionDeclaration>
  //   -> <MemberVariableDefinition>
  //   -> <MethodDefinition>
  syntax.getRule('ExportableDefinition')
    .addProd(f.nonterm('FunctionDeclaration'))
    .addProd(f.nonterm('MemberVariableDefinition'))
    .addProd(f.nonterm('MethodDefinition'));

  return syntax;

}

// Register this language extension with myjs.
myjs.registerFragment(new myjs.Fragment('harmony.Classes')
  .setSyntaxProvider(getSyntax)
  .registerType('ClassDeclaration', ClassDeclaration)
  .registerType('MemberVariableDefinition', MemberVariableDefinition)
  .registerType('MethodDefinition', MethodDefinition)
  .registerType('Constructor', Constructor));
