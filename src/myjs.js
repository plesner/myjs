// Copyright 2011 the MyJs project authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Implementation of the javascript parser and processor,
 * delegating the actual parsing to the tedir library.
 */

'use strict';

/**
 * @name myjs
 * @namespace
 */
goog.provide('myjs');

goog.require('myjs.ast');
goog.require('myjs.tedir');
goog.require('myjs.utils');

/**
 * @inheritDoc
 */
myjs.factory = {};
goog.exportSymbol('myjs.factory', myjs.factory);

/***/
myjs.factory.ignore = myjs.tedir.factory.ignore;
goog.exportProperty(myjs.factory, 'ignore', myjs.factory.ignore);

/***/
myjs.factory.nonterm = myjs.tedir.factory.nonterm;
goog.exportProperty(myjs.factory, 'nonterm', myjs.factory.nonterm);

/***/
myjs.factory.option = myjs.tedir.factory.option;
goog.exportProperty(myjs.factory, 'option', myjs.factory.option);

/***/
myjs.factory.choice = myjs.tedir.factory.choice;
goog.exportProperty(myjs.factory, 'choice', myjs.factory.choice);

/***/
myjs.factory.star = myjs.tedir.factory.star;
goog.exportProperty(myjs.factory, 'star', myjs.factory.star);

/***/
myjs.factory.plus = myjs.tedir.factory.plus;
goog.exportProperty(myjs.factory, 'plus', myjs.factory.plus);

/***/
myjs.factory.custom = myjs.tedir.factory.custom;
goog.exportProperty(myjs.factory, 'custom', myjs.factory.custom);

/***/
myjs.factory.seq = myjs.tedir.factory.seq;
goog.exportProperty(myjs.factory, 'seq', myjs.factory.seq);

/**
 * @inheritDoc
 */
myjs.Syntax = myjs.tedir.Syntax;
goog.exportSymbol('myjs.Syntax', myjs.Syntax);

/**
 * Creates a new ignored-punctuator expression, matching the punctuator with
 * the given name.
 *
 * @param {string} name the terminal name to match.
 * @return {myjs.tedir.Expression} a terminal matching the given punctuator.
 */
myjs.factory.punct = function(name) {
  return myjs.factory.ignore(myjs.tedir.factory.token(name,
    myjs.Dialect.PUNCTUATOR_MARKER_));
};

goog.exportProperty(myjs.factory, 'punct', myjs.factory.punct);

/**
 * Creates a new punctuator-with-value expression, matching the punctuator with
 * the given name.
 *
 * @param {string} name the terminal name to match.
 * @return {myjs.tedir.Expression} a terminal matching the given punctuator.
 */
myjs.factory.punctValue = function(name) {
  return myjs.tedir.factory.token(name, myjs.Dialect.PUNCTUATOR_MARKER_);
};

goog.exportProperty(myjs.factory, 'punctValue', myjs.factory.punctValue);

/**
 * Creates a new ignored-terminal expression, matching the token with the
 * given name.
 *
 * @param {string} name the terminal name to match.
 * @return {myjs.tedir.Expression} a terminal with the given name.
 */
myjs.factory.token = function(name) {
  return myjs.factory.ignore(myjs.tedir.factory.token(name));
};

goog.exportProperty(myjs.factory, 'token', myjs.factory.token);

/**
 * Creates a new ignored-keyword expression, matching the keyword with the
 * given name.
 *
 * @param {string} name the terminal name to match.
 * @return {myjs.tedir.Expression} a terminal matching the given keyword.
 */
myjs.factory.keyword = function(name) {
  return myjs.factory.ignore(myjs.tedir.factory.token(name,
    myjs.Dialect.KEYWORD_MARKER_));
};

goog.exportProperty(myjs.factory, 'keyword', myjs.factory.keyword);

/**
 * Creates a new keyword-with-value expression, matching the keyword with the
 * given name.
 *
 * @param {string} name the terminal name to match.
 * @return {myjs.tedir.Expression} a terminal matching the given keyword.
 */
myjs.factory.keywordValue = function(name) {
  return myjs.tedir.factory.token(name, myjs.Dialect.KEYWORD_MARKER_);
};

goog.exportProperty(myjs.factory, 'keywordValue', myjs.factory.keywordValue);

/**
 * Creates a new terminal-with-value expression, matching the token with the
 * given name.
 *
 * @param {string} name the terminal name to match.
 * @return {myjs.tedir.Expression} a terminal with the given name.
 */
myjs.factory.value = function(name) {
  return myjs.tedir.factory.token(name);
};

goog.exportProperty(myjs.factory, 'value', myjs.factory.value);

/**
 * Signals an error condition in tedir.
 *
 * @param {string} message An error message.
 * @constructor
 */
myjs.Error = function(message) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, myjs.Error);
  }
  this.message = message;
};

/**
 * @inheritDoc
 */
myjs.Error.prototype.toString = function() {
  return 'myjs.Error: ' + this.message;
};

/**
 * A description of a javascript dialect.
 *
 * @param {string} name the name of this dialect.
 * @constructor
 */
myjs.Dialect = function(name) {
  this.name = name;
  this.parent = 'myjs.JavaScript';
  this.fragments = [];
  this.syntax = null;
  this.grammar = null;
  this.start = 'Program';
  this.keywords = null;
  this.punctuators = null;
  this.settings = null;
  this.types = null;
};

/**
 * A map from dialect name to dialect object.
 * @private
 */
myjs.Dialect.registry_ = {};

/**
 * Returns the name that identifies this dialect.
 *
 * @return {string} the name of this dialect.
 */
myjs.Dialect.prototype.getName = function() {
  return this.name;
};

/**
 * Adds one or more fragment names to the list of fragments to include in
 * this dialect.
 *
 * @param {...string} var_args the fragment names to include.
 * @return {myjs.Dialect} this dialect, for chaining.
 */
myjs.Dialect.prototype.addFragment = function(var_args) {
  var i;
  for (i = 0; i < arguments.length; i++) {
    this.fragments.push(arguments[i]);
  }
  return this;
};

/**
 * Sets the name of this dialect's parent dialect.
 *
 * @param {?string} name the name of this dialect's parent dialect.
 * @return {myjs.Dialect} this dialect, for chaining.
 */
myjs.Dialect.prototype.extendsDialect = function(name) {
  this.parent = name;
  return this;
};

/**
 * Sets the start production to use.
 *
 * @param {string} value the name of this dialect's start nonterm.
 * @return {myjs.Dialect} this dialect, for chaining.
 */
myjs.Dialect.prototype.setStart = function(value) {
  this.start = value;
  return this;
};

/**
 * Returns the start nonterm for this dialect.
 *
 * @return {string} the name of this dialect's start nonterm.
 * @private
 */
myjs.Dialect.prototype.getStart_ = function() {
  return this.start;
};

/**
 * Returns this dialect's syntax, building it if necessary.
 *
 * @return {myjs.tedir.Syntax} this dialect's syntax.
 * @private
 */
myjs.Dialect.prototype.getSyntax_ = function() {
  if (!this.syntax) {
    var syntax = this.parent ?
      myjs.getDialect(this.parent).getSyntax_() : myjs.Syntax.create();
    var fragments = this.fragments.map(function(name) {
      var fragment = myjs.getFragment(name);
      return fragment.getSyntax_();
    });
    if (fragments.length > 0) {
      syntax = syntax.compose(fragments);
    }
    this.syntax = syntax;
  }
  return this.syntax;
};

/**
 * Given a set of objects, returns one object that for each key in one of the
 * input maps maps to that key's value in the input map.
 *
 * @param {Array.<Object>} objs an array of input maps.
 * @return {Object} the union of the input maps.
 * @private
 */
myjs.Dialect.joinObjects_ = function(objs) {
  var result = {};
  objs.forEach(function(obj) {
    Object.keys(obj).forEach(function(key) {
      result[key] = obj[key];
    });
  });
  return result;
};

/**
 * Returns a map from type names to constructor functions.
 *
 * @return {Object.<string, Function>} this dialect's type map.
 * @private
 */
myjs.Dialect.prototype.getTypes_ = function() {
  if (!this.types) {
    var types = this.fragments.map(function(fragName) {
      var frag = myjs.getFragment(fragName);
      return frag.getTypes_();
    });
    if (this.parent) {
      types.push(myjs.getDialect(this.parent).getTypes_());
    }
    this.types = myjs.Dialect.joinObjects_(types);
  }
  return this.types;
};

/**
 * Returns the type constructor for the given type name or null if none
 * is defined.
 *
 * @param {string} name the name of the type.
 * @return {?Function} the associated type constructor, or null.
 * @private
 */
myjs.Dialect.prototype.getType_ = function(name) {
  var types = this.getTypes_();
  return types.hasOwnProperty(name) ? types[name] : null;
};

/**
 * Returns this dialect's grammar, calculating it the first time this method
 * is called.
 *
 * @return {myjs.tedir.Grammar} the grammar for this dialect.
 * @private
 */
myjs.Dialect.prototype.getGrammar_ = function() {
  if (!this.grammar) {
    this.grammar = this.getSyntax_().asGrammar();
  }
  return this.grammar;
};

/**
 * Returns the scanner settings for this dialect.
 *
 * @return {myjs.ScannerSettings_} the scanner settings for this dialect.
 * @private
 */
myjs.Dialect.prototype.getScannerSettings_ = function() {
  if (!this.settings) {
    var keywords = this.getKeywords_();
    var punctuators = this.getPunctuators_();
    this.settings = new myjs.ScannerSettings_(keywords, punctuators);
  }
  return this.settings;
};

/**
 * Parses the given source, returning a syntax tree.
 *
 * @param {string} source source code in this dialect.
 * @param {myjs.tedir.SourceOrigin} origin origin of the source code.
 * @param {boolean} trace true if parsing should be traced.
 * @return {*} the syntax tree for the given source.
 * @private
 * @suppress {checkTypes}
 */
myjs.Dialect.prototype.parse_ = function(source, origin, trace) {
  var grammar = this.getGrammar_();
  var parser = new myjs.tedir.Parser(grammar);
  var tokens = this.tokenize_(source);
  return parser.parse(this.getStart_(), tokens, origin, trace);
};

/**
 * Abstract syntax tree visitor.
 *
 * @interface
 */
myjs.AstVisitor = function() { };

/**
 * Visit a typed syntax tree node.
 *
 * @param {!Object} node the ast node.
 * @param {?Function} type that type's constructor function, or null.
 * @param {myjs.Dialect} dialect the dialect we're traversing within.
 * @return {*} whatever.
 */
myjs.AstVisitor.prototype.visitNode = goog.abstractMethod;

/**
 * Visit an array of nodes.
 *
 * @param {Array} nodes the ast nodes.
 * @param {myjs.Dialect} dialect the dialect we're traversing within.
 * @return {*} whatever.
 */
myjs.AstVisitor.prototype.visitArray = goog.abstractMethod;

/**
 * Visit a primitive value occurring in the syntax tree.
 *
 * @param {*} value the ast nodes.
 * @param {myjs.Dialect} dialect the dialect we're traversing within.
 * @return {*} whatever.
 */
myjs.AstVisitor.prototype.visitPrimitive = goog.abstractMethod;

/**
 * Ast visitor for translating syntax trees.
 *
 * @constructor
 * @implements myjs.AstVisitor
 * @private
 */
myjs.TranslateVisitor_ = function() { };

/**
 * @inheritDoc
 * @suppress {missingProperties}
 */
myjs.TranslateVisitor_.prototype.visitNode = function(node, type, dialect) {
  var self = this;
  if (type && type.prototype['translate']) {
    // If this node type has a custom translater we call it to do the
    // translation.
    return type.prototype['translate'].call(node, dialect, function(child) {
      return dialect.traverse(child, self);
    });
  } else {
    // Otherwise we manually scan through the node and build a translated
    // result.
    var keys = Object.keys(node);
    var result = {};
    keys.forEach(function(key) {
      result[key] = dialect.traverse(node[key], self);
    });
    return result;
  }
};

/**
 * @inheritDoc
 */
myjs.TranslateVisitor_.prototype.visitArray = function(nodes, dialect) {
  var self = this;
  return nodes.map(function(node) { return dialect.traverse(node, self); });
};

/**
 * @inheritDoc
 */
myjs.TranslateVisitor_.prototype.visitPrimitive = function(value, dialect) {
  return value;
};

/**
 * Translates an extended ast into plain javascript.
 *
 * @param {*} ast the syntax tree to translate.
 * @return {*} the translated ast.
 * @private
 */
myjs.Dialect.prototype.translate_ = function(ast) {
  var visitor = new myjs.TranslateVisitor_();
  return this.traverse(ast, visitor);
};

/**
 * Traverses a syntax tree and invokes the appropriate methods on the given
 * visitor.
 *
 * @param {*} ast the syntax tree to traverse.
 * @param {myjs.AstVisitor} visitor the visitor to invoke.
 * @return {*} whatever the visitor returns.
 * @suppress {checkTypes}
 */
myjs.Dialect.prototype.traverse = function(ast, visitor) {
  if (Array.isArray(ast)) {
    return visitor.visitArray(ast, this);
  } else if (ast == null || typeof ast == 'string' || typeof ast == 'number' ||
      typeof ast == 'boolean') {
    return visitor.visitPrimitive(ast, this);
  } else if (typeof ast == 'object' && typeof ast['type'] == 'string') {
    var type = this.getType_(ast['type']);
    return visitor.visitNode(ast, type, this);
  } else {
    throw new myjs.Error('Unexpected syntax tree node ' + JSON.stringify(ast) +
      '.');
  }
};

/**
 * Returns the tokens of a piece of JavaScript source code, tokenized
 * according to the tokens of this dialect.
 *
 * @param {string} source source code to tokenize.
 * @return {Array.<myjs.tedir.Token>} the input as tokens.
 * @private
 */
myjs.Dialect.prototype.tokenize_ = function(source) {
  var stream = new myjs.Scanner_(source, this.getScannerSettings_());
  var tokens = [];
  while (stream.hasMore()) {
    var next = stream.scanToken();
    tokens.push(next);
  }
  return tokens;
};

/**
 * Translates source code written in this dialect to plain javascript.
 *
 * @param {string} source source code in this dialect.
 * @param {myjs.tedir.SourceOrigin} origin origin of the source code.
 * @param {boolean} trace true if parsing should be traced.
 * @return {*} plain javascript translation of the source.
 */
myjs.Dialect.prototype.translate = function(source, origin, trace) {
  var ast = this.parse_(source, origin, trace);
  if (trace) {
    return ast;
  }
  var translated = this.translate_(ast);
  return this.unparse_(translated);
};

goog.exportProperty(myjs.Dialect.prototype, 'translate',
  myjs.Dialect.prototype.translate);

/**
 * Returns the set of keywords used by this dialect.
 *
 * @return {Array.<string>} the keywords for this dialect.
 * @private
 */
myjs.Dialect.prototype.getKeywords_ = function() {
  if (!this.keywords) {
    this.calcTokenTypes_();
  }
  return this.keywords;
};

/**
 * Returns the set of punctuators used by this dialect.
 *
 * @return {Array.<string>} the punctuators for this dialect.
 * @private
 */
myjs.Dialect.prototype.getPunctuators_ = function() {
  if (!this.punctuators) {
    this.calcTokenTypes_();
  }
  return this.punctuators;
};

/**
 * Marker used to identify keyword tokens.
 * @private
 * @const
 */
myjs.Dialect.KEYWORD_MARKER_ = 'keyword';

/**
 * Marker used to identify punctuator tokens.
 * @private
 * @const
 */
myjs.Dialect.PUNCTUATOR_MARKER_ = 'punctuator';

/**
 * Scans the grammar and extracts a sorted list of all keywords and
 * punctuators, storing them in the appropriate fields.
 *
 * @private
 */
myjs.Dialect.prototype.calcTokenTypes_ = function() {
  var keywordMap = {};
  var punctuatorMap = {};
  function visitNode(node) {
    if (node.getType() == 'TOKEN') {
      switch (node.getKind()) {
      case myjs.Dialect.KEYWORD_MARKER_:
        keywordMap[node.value] = true;
        break;
      case myjs.Dialect.PUNCTUATOR_MARKER_:
        punctuatorMap[node.value] = true;
        break;
      }
    } else {
      node.forEachChild(visitNode);
    }
  }
  this.getSyntax_().forEachRule(function(name, value) {
    visitNode(value);
  });
  this.keywords = Object.keys(keywordMap).sort();
  this.punctuators = Object.keys(punctuatorMap).sort();
};

/**
 * Formats the given ast as source code and returns it as a string.
 *
 * @param {*} ast the ast node to unparse.
 * @return {string} the source code as a string.
 * @private
 */
myjs.Dialect.prototype.unparse_ = function(ast) {
  var context = new myjs.SourceStream(this);
  context.node(ast);
  return context.flush_();
};

/**
 * Adds the given dialect to the set known by myjs.
 *
 * @param {myjs.Dialect} dialect the dialect to register.
 */
myjs.registerDialect = function(dialect) {
  myjs.Dialect.registry_[dialect.getName()] = dialect;
};

/**
 * Returns the dialect registered under the given name.
 *
 * @param {string} name the dialect name.
 * @return {myjs.Dialect} the dialect with the given name.
 */
myjs.getDialect = function(name) {
  if (!myjs.Dialect.registry_.hasOwnProperty(name)) {
    return null;
  }
  return myjs.Dialect.registry_[name];
};

goog.exportSymbol('myjs.getDialect', myjs.getDialect);

/**
 * A (potentially incomplete) fragment of syntax that defines how a type
 * of syntax should be parsed and processed.
 *
 * @param {string} name the unique name of this fragment.
 * @constructor
 */
myjs.Fragment = function(name) {
  this.name = name;
  this.syntaxProvider = null;
  this.syntax = null;
  this.types = {};
};

goog.exportSymbol('myjs.Fragment', myjs.Fragment);

/**
 * A map from fragment names to fragment objects.
 *
 * @private
 */
myjs.Fragment.registry_ = {};

/**
 * Sets the syntax provider function for this fragment. This function will be
 * called to build the syntax if this fragment is used.
 *
 * @param {Function} syntaxProvider function to call to get the syntax.
 * @return {myjs.Fragment} this fragment, for chaining.
 */
myjs.Fragment.prototype.setSyntaxProvider = function(syntaxProvider) {
  this.syntaxProvider = syntaxProvider;
  return this;
};

goog.exportProperty(myjs.Fragment.prototype, 'setSyntaxProvider',
  myjs.Fragment.prototype.setSyntaxProvider);

/**
 * Registers the given constructor as the type for the given ast node type.
 *
 * @param {string} name the node type name.
 * @param {Function} constructor the associated constructor.
 * @return {myjs.Fragment} this fragment, for chaining.
 */
myjs.Fragment.prototype.registerType = function(name, constructor) {
  this.types[name] = constructor;
  return this;
};

goog.exportProperty(myjs.Fragment.prototype, 'registerType',
  myjs.Fragment.prototype.registerType);

/**
 * Returns the type map for this fragment.
 *
 * @return {Object.<string,Function>} the type map for this fragment.
 * @private
 */
myjs.Fragment.prototype.getTypes_ = function() {
  return this.types;
};

/**
 * Builds (first time) and returns the syntax for this fragment.
 *
 * @return {myjs.tedir.Syntax} the syntax for this fragment.
 * @private
 */
myjs.Fragment.prototype.getSyntax_ = function() {
  if (!this.syntax) {
    var value = (this.syntaxProvider)();
    if (!value) {
      throw new myjs.Error('Fragment "' + this.name + '" provided no syntax.');
    }
    this.syntax = value;
  }
  return this.syntax;
};

/**
 * Returns the name of this fragment.
 *
 * @return {string} the name of this fragment.
 */
myjs.Fragment.prototype.getName = function() {
  return this.name;
};

/**
 * Registers the given fragment under its name in the fragment registry.
 *
 * @param {myjs.Fragment} fragment the fragment to register.
 */
myjs.registerFragment = function(fragment) {
  myjs.Fragment.registry_[fragment.getName()] = fragment;
};

goog.exportSymbol('myjs.registerFragment', myjs.registerFragment);

/**
 * Returns the fragment registered under the given name.
 *
 * @param {string} name the fragment name.
 * @return {myjs.Fragment} the fragment with the given name.
 */
myjs.getFragment = function(name) {
  if (!myjs.Fragment.registry_.hasOwnProperty(name)) {
    throw new myjs.Error('Unknown fragment "' + name + '".');
  }
  return myjs.Fragment.registry_[name];
};

goog.exportSymbol('myjs.getFragment', myjs.getFragment);

/**
 * A "hard" token with a string value.
 *
 * @param {string} value the value of this token.
 * @param {string=} opt_type the type of this token. If none is specified
 *   the value will be used.
 * @constructor
 * @implements myjs.tedir.Token
 * @private
 */
myjs.HardToken_ = function(value, opt_type) {
  this.value = value;
  this.type = opt_type || value;
};

/**
 * @inheritDoc
 */
myjs.HardToken_.prototype.isSoft = function() {
  return false;
};

goog.exportProperty(myjs.HardToken_.prototype, 'isSoft',
  myjs.HardToken_.prototype.isSoft);

/**
 * @inheritDoc
 */
myjs.HardToken_.prototype.toString = function() {
  if (this.value != this.type) {
    return '[' + this.type + ':' + this.value + ']';
  } else {
    return '[' + this.value + ']';
  }
};

/**
 * A "soft" piece of ether that doesn't affect parsing but which we need
 * to keep around to be able to unparse the code again.
 *
 * @param {string} value the value of this token.
 * @constructor
 * @implements myjs.tedir.Token
 * @private
 */
myjs.SoftToken_ = function(value) {
  this.value = value;
};

/**
 * @inheritDoc
 */
myjs.SoftToken_.prototype.toString = function() {
  return '(' + this.value + ')';
};

/**
 * @inheritDoc
 */
myjs.SoftToken_.prototype.isSoft = function() {
  return true;
};

goog.exportProperty(myjs.SoftToken_.prototype, 'isSoft',
  myjs.SoftToken_.prototype.isSoft);

/**
 * A collection of settings that control how a scanner tokenizes input.
 *
 * @param {Array.<string>} keywords a list of keywords.
 * @param {Array.<string>} punctuation a list of punctuation tokens.
 * @constructor
 * @private
 */
myjs.ScannerSettings_ = function(keywords, punctuation) {
  this.keywords = {};
  keywords.forEach(function(word) {
    this.keywords[word] = true;
  }.bind(this));
  this.punctuation = myjs.Trie_.build(punctuation);
};

/**
 * Returns true if the given string is a keyword for these settings.
 *
 * @param {string} word the word to test.
 * @return {boolean} true iff the given word is a keyword.
 */
myjs.ScannerSettings_.prototype.isKeyword = function(word) {
  return this.keywords.hasOwnProperty(word);
};

/**
 * Returns true if the given character occurs in any punctuation string for
 * these settings.
 *
 * @param {string} chr the character to test.
 * @return {boolean} true iff the character occurs in a punctuation string.
 */
myjs.ScannerSettings_.prototype.isPunctuation = function(chr) {
  return !!this.punctuation.get(chr);
};

/**
 * Returns the punctuation trie for these settings.
 *
 * @return {myjs.Trie_} a trie recognizing these settings' punctuation.
 */
myjs.ScannerSettings_.prototype.getPunctuation = function() {
  return this.punctuation;
};

/**
 * A simple object-as-map based trie.
 *
 * @param {Object.<string,myjs.Trie_>} map Map from characters to subtries.
 * @constructor
 * @private
 */
myjs.Trie_ = function(map) {
  this.map = map;
};

/**
 * A singleton empty trie.
 */
myjs.Trie_.EMPTY = new myjs.Trie_({});

/**
 * Returns a trie that matches on the given set of strings.
 *
 * @param {Array.<string>} strings the strings to recognize.
 * @return {myjs.Trie_} a trie that recognizes the given strings.
 */
myjs.Trie_.build = function(strings) {
  if (strings.length == 0) {
    return myjs.Trie_.EMPTY;
  }
  var firstToRest = {};
  strings.forEach(function(string) {
    var first = string[0];
    var rest = string.substring(1);
    if (!firstToRest.hasOwnProperty(first)) {
      firstToRest[first] = [];
    }
    if (rest.length > 0) {
      firstToRest[first].push(rest);
    }
  });
  var subTries = {};
  Object.keys(firstToRest).forEach(function(chr) {
    subTries[chr] = myjs.Trie_.build(firstToRest[chr]);
  });
  return new myjs.Trie_(subTries);
};

/**
 * Returns the subtrie of this trie for the given character.
 *
 * @param {string} chr the character to look up.
 * @return {?myjs.Trie_} the subtrie or null if there is none.
 */
myjs.Trie_.prototype.get = function(chr) {
  return this.map[chr];
};

/**
 * A simple stream that provides the contents of a string one char at a
 * time.
 *
 * @param {string} source the source code to scan.
 * @param {myjs.ScannerSettings_} settings the token settings to use.
 * @constructor
 * @private
 */
myjs.Scanner_ = function(source, settings) {
  this.settings = settings;
  this.source = source;
  this.cursor = 0;
};

/**
 * Returns the current character.
 *
 * @return {string} the current character.
 */
myjs.Scanner_.prototype.getCurrent = function() {
  return this.source[this.cursor];
};

/**
 * Returns the current lookahead character.
 *
 * @return {string} the character after the current one.
 */
myjs.Scanner_.prototype.getLookahead = function() {
  return this.source[this.cursor + 1];
};

/**
 * Does this character stream have more characters?
 *
 * @return {boolean} true iff there is at least one character left.
 */
myjs.Scanner_.prototype.hasMore = function() {
  return this.cursor < this.source.length;
};

/**
 * Returns true if there is at least one character left in the input
 * past the current character.
 *
 * @return {boolean} true iff there is at least two characters left.
 */
myjs.Scanner_.prototype.hasLookahead = function() {
  return (this.cursor + 1) < this.source.length;
};

/**
 * Advances the stream to the next character.
 */
myjs.Scanner_.prototype.advance = function() {
  this.cursor++;
};

/**
 * Advance the specified amount if possible but not past the end of the
 * input.
 *
 * @param {number} amount the number of chars to advance.
 */
myjs.Scanner_.prototype.advanceIfPossible = function(amount) {
  this.cursor = Math.min(this.cursor + amount, this.source.length);
};

/**
 * Returns the current character offset.
 *
 * @return {number} the 0-based offset of the current character.
 */
myjs.Scanner_.prototype.getCursor = function() {
  return this.cursor;
};

/**
 * Returns the part of the input between 'start' and 'end'.
 *
 * @param {number} start the start point.
 * @param {number} end the end point.
 * @return {string} the substring of the input between start and end.
 */
myjs.Scanner_.prototype.getPart = function(start, end) {
  return this.source.substring(start, end);
};

/**
 * Is the given string a single character of whitespace?
 *
 * @param {string} c the character to check.
 * @return {boolean} is c a whitespace character?
 */
myjs.Scanner_.isWhiteSpace = function(c) {
  return (/\s/).test(c);
};

/**
 * Is this character a legal digit?
 *
 * @param {string} c the character to check.
 * @return {boolean} is c a digit?
 */
myjs.Scanner_.isDecimalDigit = function(c) {
  return (/[\d]/).test(c);
};

/**
 * Is this character a legal hex digit?
 *
 * @param {string} c the character to check.
 * @return {boolean} is c a hex digit?
 */
myjs.Scanner_.isHexDigit = function(c) {
  return (/[0-9a-fA-F]/).test(c);
};

/**
 * Is this character allowed as the first in an identifier?
 *
 * @param {string} c the character to check.
 * @return {boolean} is c legal as the start of an identifier?
 */
myjs.Scanner_.isIdentifierStart = function(c) {
  return (/[\w]/).test(c);
};

/**
 * Is this character allowed as the first in an identifier?
 *
 * @param {string} c the character to check.
 * @return {boolean} is c legal as part of an identifier?
 */
myjs.Scanner_.isIdentifierPart = function(c) {
  return (/[\w\d]/).test(c);
};

/**
 * Extracts the next JavaScript token from the given stream.
 *
 * @return {myjs.tedir.Token} the next token.
 */
myjs.Scanner_.prototype.scanToken = function() {
  var c = this.getCurrent();
  switch (c) {
  case '\"':
  case "'":
    return this.scanString();
  case '/':
    switch (this.getLookahead()) {
    case '/':
      return this.scanEndOfLineComment();
    case '*':
      return this.scanBlockComment();
    case '=':
      this.advance();
      return this.advanceAndYield('/=');
    default:
      return this.advanceAndYield('/');
    }
  }
  if (myjs.Scanner_.isWhiteSpace(c)) {
    return this.scanWhiteSpace();
  } else if (this.settings.isPunctuation(c)) {
    return this.scanPunctuation();
  } else if (myjs.Scanner_.isDecimalDigit(c)) {
    return this.scanNumber();
  } else if (myjs.Scanner_.isIdentifierStart(c)) {
    return this.scanIdentifier();
  } else {
    this.advance();
    return new myjs.SoftToken_(c);
  }
};

/**
 * Skips over the current character and returns a hard token with the given
 * contents.
 *
 * @param {string} value the token value.
 * @param {string=} opt_type an optional token type.
 * @return {myjs.HardToken_} a hard token with the given value/type.
 */
myjs.Scanner_.prototype.advanceAndYield = function(value, opt_type) {
  this.advance();
  return new myjs.HardToken_(value, opt_type);
};

/**
 * Scans a single block of whitespace.
 *
 * @return {myjs.SoftToken_} a soft token containing the whitespace.
 */
myjs.Scanner_.prototype.scanWhiteSpace = function() {
  var start = this.getCursor();
  while (this.hasMore() && myjs.Scanner_.isWhiteSpace(this.getCurrent())) {
    this.advance();
  }
  var end = this.getCursor();
  return new myjs.SoftToken_(this.getPart(start, end));
};

/**
 * Scans past an identifier.
 *
 * @return {myjs.HardToken_} a hard token containing the string value.
 */
myjs.Scanner_.prototype.scanIdentifier = function() {
  var start = this.getCursor();
  while (this.hasMore() && myjs.Scanner_.isIdentifierPart(this.getCurrent())) {
    this.advance();
  }
  var end = this.getCursor();
  var value = this.getPart(start, end);
  if (this.settings.isKeyword(value)) {
    return new myjs.HardToken_(value);
  } else {
    return new myjs.HardToken_(value, 'Identifier');
  }
};

/**
 * Scans past a piece of punctuation, taking the longest substring that
 * matches a string in the settings' punctuation set.
 *
 * @return {myjs.HardToken_} a hard token containing the string value.
 */
myjs.Scanner_.prototype.scanPunctuation = function() {
  var start = this.getCursor();
  var chr = this.getCurrent();
  var current = this.settings.getPunctuation();
  do {
    current = current.get(this.getCurrent());
    if (current) {
      this.advance();
    }
  } while (current && this.hasMore());
  var end = this.getCursor();
  var value = this.getPart(start, end);
  return new myjs.HardToken_(value);
};

/**
 * Scans past a number token.
 *
 * @return {myjs.HardToken_} a hard token containing the string value.
 */
myjs.Scanner_.prototype.scanNumber = function() {
  var start = this.getCursor();
  var hasScanned = false;
  if (this.getCurrent() == '0') {
    this.advance();
    if (this.getCurrent() == 'x' || this.getCurrent() == 'X') {
      this.advance();
      this.scanHexDigits();
      hasScanned = true;
    }
  }
  if (!hasScanned) {
    this.scanDecimalDigits();
    if (this.hasMore() && this.getCurrent() == '.') {
      this.advance();
      this.scanDecimalDigits();
    }
  }
  var end = this.getCursor();
  var value = this.getPart(start, end);
  return new myjs.HardToken_(value, 'NumericLiteral');

};

/**
 * Scans over a sequence of plain decimal digits.
 */
myjs.Scanner_.prototype.scanDecimalDigits = function() {
  while (this.hasMore() && myjs.Scanner_.isDecimalDigit(this.getCurrent())) {
    this.advance();
  }
};

/**
 * Scans over a sequence of hex digits.
 */
myjs.Scanner_.prototype.scanHexDigits = function() {
  while (this.hasMore() && myjs.Scanner_.isHexDigit(this.getCurrent())) {
    this.advance();
  }
};

/**
 * Scans past a string token.
 *
 * @return {myjs.HardToken_} a hard token containing the string value with
 *   the quotes.
 */
myjs.Scanner_.prototype.scanString = function() {
  var start = this.getCursor();
  var first = this.getCurrent();
  this.advance();
  while (this.hasMore() && this.getCurrent() != first) {
    // Skip over escaped characters
    if (this.getCurrent() == '\\') {
      this.advance();
    }
    this.advance();
  }
  this.advanceIfPossible(1);
  var end = this.getCursor();
  var value = this.getPart(start, end);
  return new myjs.HardToken_(value, 'StringLiteral');
};

/**
 * Scans past an end-of-line comment.
 *
 * @return {myjs.SoftToken_} a soft token containing the comment.
 */
myjs.Scanner_.prototype.scanEndOfLineComment = function() {
  var start = this.getCursor();
  while (this.hasMore() && (this.getCurrent() != '\n')) {
    this.advance();
  }
  this.advanceIfPossible(1);
  var end = this.getCursor();
  var value = this.getPart(start, end);
  return new myjs.SoftToken_(value);
};

/**
 * Scans past a block comment.
 *
 * @return {myjs.SoftToken_} a soft token containing the comment.
 */
myjs.Scanner_.prototype.scanBlockComment = function() {
  var start = this.getCursor();
  while (this.hasLookahead() &&
    (this.getCurrent() != '*' || this.getLookahead() != '/')) {
    this.advance();
  }
  this.advanceIfPossible(2);
  var end = this.getCursor();
  var value = this.getPart(start, end);
  return new myjs.SoftToken_(value);
};

/**
 * Context object passed to ast nodes when unparsing.
 *
 * @param {myjs.Dialect} dialect the dialect to use to resolve nodes.
 * @constructor
 * @implements myjs.AstVisitor
 */
myjs.SourceStream = function(dialect) {
  this.dialect = dialect;
  this.types = dialect.getTypes_();
  this.hasPendingNewline = false;
  this.indentLevel = 0;
  this.text = [];
};

/**
 * Increase the indentation level one step.
 *
 * @return {myjs.SourceStream} this object, for chaining.
 */
myjs.SourceStream.prototype.indent = function() {
  this.indentLevel++;
  return this;
};

/**
 * Decrease the indentation level one step.
 *
 * @return {myjs.SourceStream} this object, for chaining.
 */
myjs.SourceStream.prototype.deindent = function() {
  this.indentLevel--;
  return this;
};

/**
 * Schedule a newline with indentation to be printed before the next hard
 * string is written.
 *
 * @return {myjs.SourceStream} this object, for chaining.
 */
myjs.SourceStream.prototype.newline = function() {
  this.hasPendingNewline = true;
  return this;
};

/**
 * Recursively unparse the given ast node.
 *
 * @param {*} ast the node to unparse.
 * @return {myjs.SourceStream} this object, for chaining.
 */
myjs.SourceStream.prototype.node = function(ast) {
  this.dialect.traverse(ast, this);
  return this;
};

/**
 * @inheritDoc
 */
myjs.SourceStream.prototype.visitArray = function(elms, dialect) {
  this.nodes(elms);
};

/**
 * @inheritDoc
 */
myjs.SourceStream.prototype.visitPrimitive = function(value, dialect) {
  this.write(String(value));
};

/**
 * @inheritDoc
 * @suppress {missingProperties}
 */
myjs.SourceStream.prototype.visitNode = function(node, type, dialect) {
  if (type) {
    type.prototype.unparse.call(node, this);
  } else {
    this.write('#<' + type + '>');
  }
};

/**
 * Recursively unparse the given list of ast nodes.
 *
 * @param {Array.<myjs.ast.Node>} asts the nodes to unparse.
 * @param {string=} opt_separator optional separator string to print between
 *   the nodes.
 * @return {myjs.SourceStream} this object, for chaining.
 */
myjs.SourceStream.prototype.nodes = function(asts, opt_separator) {
  var i;
  for (i = 0; i < asts.length; i++) {
    if (opt_separator && (i > 0)) {
      this.write(opt_separator);
    }
    this.node(asts[i]);
  }
  return this;
};

/**
 * Add a list of strings to this stream.
 *
 * @param {Array.<string>} strs the strings to add.
 * @param {string=} opt_separator optional separator string to print between
 *   the strings.
 * @return {myjs.SourceStream} this object, for chaining.
 */
myjs.SourceStream.prototype.writes = function(strs, opt_separator) {
  var i;
  for (i = 0; i < strs.length; i++) {
    if (opt_separator && (i > 0)) {
      this.write(opt_separator);
    }
    this.write(strs[i]);
  }
  return this;
};

/**
 * Check if there is a pending newline to flush and flush it if there is.
 * @private
 */
myjs.SourceStream.prototype.flushNewline_ = function() {
  if (this.hasPendingNewline) {
    this.hasPendingNewline = false;
    this.text.push('\n');
    for (var i = 0; i < this.indentLevel; i++) {
      this.text.push('  ');
    }
  }
};

/**
 * Adds a single string to the output of this stream.
 *
 * @param {string} str the string to add.
 * @return {myjs.SourceStream} this object, for chaining.
 */
myjs.SourceStream.prototype.write = function(str) {
  this.flushNewline_();
  this.text.push(str);
  return this;
};

/**
 * Flush any newlines and return the contents as a string.
 *
 * @return {string} the contents of this stream.
 * @private
 */
myjs.SourceStream.prototype.flush_ = function() {
  this.flushNewline_();
  return this.text.join('');
};

// Register the default dialect.
myjs.registerDialect(new myjs.Dialect('myjs.JavaScript')
  .extendsDialect(null)
  .addFragment('myjs.Program')
  .addFragment('myjs.Statement')
  .addFragment('myjs.Declaration')
  .addFragment('myjs.Core')
  .addFragment('myjs.LeftHandSide')
  .addFragment('myjs.Operators')
  .addFragment('myjs.Expression')
  .addFragment('myjs.Control')
  .addFragment('myjs.Iteration')
  .addFragment('myjs.Exceptions'));
