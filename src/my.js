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
 * Implementation of the javascript parser and processor, delegating the actual
 * parsing to the tedir library.
 */

'use strict';

goog.provide('myjs');

goog.require('myjs.ast');
goog.require('myjs.utils');
goog.require('myjs.tedir');

myjs.factory = {};
Object.keys(myjs.tedir.factory).forEach(function(key) {
  myjs.factory[key] = myjs.tedir.factory[key];
});

myjs.Syntax = myjs.tedir.Syntax;

myjs.factory.punct = function(name) {
  return myjs.factory.ignore(myjs.tedir.factory.token(name, PUNCTUATOR_MARKER));
};

myjs.factory.punctValue = function(name) {
  return myjs.tedir.factory.token(name, PUNCTUATOR_MARKER);
};

myjs.factory.token = function(name) {
  return myjs.factory.ignore(myjs.tedir.factory.token(name, null));
};

myjs.factory.keyword = function(name) {
  return myjs.factory.ignore(myjs.tedir.factory.token(name, KEYWORD_MARKER));
};

myjs.factory.keywordValue = function(name) {
  return myjs.tedir.factory.token(name, KEYWORD_MARKER);
};

myjs.factory.value = function(name) {
  return myjs.tedir.factory.token(name, null);
};

var KEYWORD_MARKER = 'keyword';
var PUNCTUATOR_MARKER = 'punctuator';

/**
 * Signals an error condition in tedir.
 */
myjs.Error = function(message) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, myjs.Error);
  }
  this.message = message;
};

myjs.Error.prototype.toString = function() {
  return 'myjs.Error: ' + this.message;
};

/**
 * A map from dialect name to dialect object.
 */
myjs.dialectRegistry = {};

/**
 * A description of a javascript dialect.
 */
myjs.Dialect = function(name) {
  this.name = name;
  this.parent = null;
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
 * Returns the name that identifies this dialect.
 */
myjs.Dialect.prototype.getName = function() {
  return this.name;
};

/**
 * Adds one or more fragment names to the list of fragments to include in
 * this dialect.
 */
myjs.Dialect.prototype.addFragment = function(var_args) {
  var i;
  for (i = 0; i < arguments.length; i++) {
    this.fragments.push(arguments[i]);
  }
  return this;
};

myjs.Dialect.prototype.extendsDialect = function(name) {
  this.parent = name;
  return this;
};

/**
 * Sets the start production to use.
 */
myjs.Dialect.prototype.setStart = function(value) {
  this.start = value;
  return this;
};

myjs.Dialect.prototype.getStart = function() {
  return this.start;
};

/**
 * Returns this dialect's syntax, building it if necessary.
 */
myjs.Dialect.prototype.getSyntax = function() {
  if (!this.syntax) {
    var syntax = this.parent
      ? myjs.getDialect(this.parent).getSyntax()
      : myjs.Syntax.create();
    var fragments = this.fragments.map(function(name) {
      var fragment = myjs.getFragment(name);
      return fragment.getSyntax();
    });
    if (fragments.length > 0) {
      syntax = syntax.compose(fragments);
    }
    this.syntax = syntax;
  }
  return this.syntax;
};

myjs.Dialect.joinObjects = function(objs) {
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
 */
myjs.Dialect.prototype.getTypes = function() {
  if (!this.types) {
    var types = this.fragments.map(function(fragName) {
      var frag = myjs.getFragment(fragName);
      return frag.getTypes();
    });
    if (this.parent) {
      types.push(myjs.getDialect(this.parent).getTypes());
    }
    this.types = myjs.Dialect.joinObjects(types);
  }
  return this.types;
};

/**
 * Returns this dialect's grammar.
 */
myjs.Dialect.prototype.getGrammar = function() {
  if (!this.grammar) {
    this.grammar = this.getSyntax().asGrammar();
  }
  return this.grammar;
};

myjs.Dialect.prototype.getSettings = function() {
  if (!this.settings) {
    var keywords = this.getKeywords();
    var punctuators = this.getPunctuators();
    this.settings = new myjs.TokenizerSettings(keywords, punctuators);
  }
  return this.settings;
};

/**
 * Parses the given source, returning a syntax tree.
 */
myjs.Dialect.prototype.parseSource = function(source, origin, trace) {
  var grammar = this.getGrammar();
  var parser = new myjs.tedir.Parser(grammar);
  var tokens = myjs.tokenize(source, this.getSettings());
  return parser.parse(this.getStart(), tokens, origin, trace);
};

myjs.Dialect.prototype.translate = function(source, origin, trace) {
  var ast = this.parseSource(source, origin, trace);
  if (trace) {
    return ast;
  }
  return this.unparse(ast);
};

/**
 * Returns the set of keywords used by this dialect.
 */
myjs.Dialect.prototype.getKeywords = function() {
  if (!this.keywords) {
    this.calcTokenTypes();
  }
  return this.keywords;
};

/**
 * Returns the set of punctuators used by this dialect.
 */
myjs.Dialect.prototype.getPunctuators = function() {
  if (!this.punctuators) {
    this.calcTokenTypes();
  }
  return this.punctuators;
};

/**
 * Scans the grammar and extracts a sorted list of all keywords and
 * punctuators, storing them in the appropriate fields.
 */
myjs.Dialect.prototype.calcTokenTypes = function() {
  var keywordMap = {};
  var punctuatorMap = {};
  function visitNode(node) {
    if (node.getType() == 'TOKEN') {
      switch (node.getKind()) {
      case KEYWORD_MARKER:
        keywordMap[node.value] = true;
        break;
      case PUNCTUATOR_MARKER:
        punctuatorMap[node.value] = true;
        break;
      }
    } else {
      node.forEachChild(visitNode);
    }
  }
  this.getSyntax().forEachRule(function(name, value) {
    visitNode(value);
  });
  this.keywords = Object.keys(keywordMap).sort();
  this.punctuators = Object.keys(punctuatorMap).sort();
};

myjs.Dialect.prototype.unparse = function(ast) {
  var context = new myjs.UnparseContext(this);
  context.node(ast);
  return context.flush();
};

/**
 * Adds the given dialect to the set known by myjs.
 */
myjs.registerDialect = function(dialect) {
  myjs.dialectRegistry[dialect.getName()] = dialect;
};

/**
 * Returns the specified named dialect, or null if it doesn't exist.
 */
myjs.getDialect = function(name) {
  return myjs.dialectRegistry[name];
};

/**
 * A map from fragment name to fragment object.
 */
myjs.fragmentRegistry = {};

/**
 * A (potentially incomplete) fragment of syntax that defines how a type
 * of syntax should be parsed and processed.
 */
myjs.Fragment = function(name) {
  this.name = name;
  this.syntaxProvider = null;
  this.syntax = null;
  this.types = {};
};

myjs.Fragment.prototype.setSyntaxProvider = function(syntaxProvider) {
  this.syntaxProvider = syntaxProvider;
  return this;
};

myjs.Fragment.prototype.registerType = function(name, constructor) {
  this.types[name] = constructor;
  return this;
};

myjs.Fragment.prototype.getTypes = function() {
  return this.types;
};

/**
 * Builds and returns the syntax for this fragment.
 */
myjs.Fragment.prototype.getSyntax = function() {
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
 */
myjs.Fragment.prototype.getName = function() {
  return this.name;
};

myjs.registerFragment = function(fragment) {
  myjs.fragmentRegistry[fragment.getName()] = fragment;
};

myjs.getFragment = function(name) {
  if (!myjs.fragmentRegistry.hasOwnProperty(name)) {
    throw new myjs.Error('Unknown fragment "' + name + '".');
  }
  return myjs.fragmentRegistry[name];
};

/**
 * A "hard" token with a string value.
 */
myjs.HardToken = function(value, typeOpt) {
  this.value = value;
  this.type = typeOpt || value;
};

/**
 * Is this a soft non-semantic token?
 */
myjs.HardToken.prototype.isSoft = function() {
  return false;
};

myjs.HardToken.prototype.toString = function() {
  if (this.value != this.type) {
    return '[' + this.type + ':' + this.value + ']';
  } else {
    return '[' + this.value + ']';
  }
};

/**
 * A "soft" piece of ether that doesn't affect parsing but which we need
 * to keep around to be able to unparse the code again.
 */
myjs.SoftToken = function(value) {
  this.value = value;
};

myjs.SoftToken.prototype.toString = function() {
  return '(' + this.value + ')';
};

myjs.SoftToken.prototype.isSoft = function() {
  return true;
};

myjs.TokenizerSettings = function(keywords, punctuation) {
  this.keywords = {};
  keywords.forEach(function(word) {
    this.keywords[word] = true;
  }.bind(this));
  this.punctuation = myjs.Trie.build(punctuation);
};

myjs.TokenizerSettings.prototype.isKeyword = function(word) {
  return this.keywords.hasOwnProperty(word);
};

myjs.TokenizerSettings.prototype.isPunctuation = function(chr) {
  return this.punctuation.get(chr);
};

myjs.TokenizerSettings.prototype.getPunctuation = function() {
  return this.punctuation;
};

myjs.Trie = function(map) {
  this.map = map;
};

/**
 * A singleton empty trie.
 */
myjs.Trie.EMPTY = new myjs.Trie({});

/**
 * Returns a trie that matches on the given set of strings.
 */
myjs.Trie.build = function(strings) {
  if (strings.length == 0) {
    return myjs.Trie.EMPTY;
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
    subTries[chr] = myjs.Trie.build(firstToRest[chr]);
  });
  return new myjs.Trie(subTries);
};

myjs.Trie.prototype.get = function(chr) {
  return this.map[chr];
};

/**
 * A simple stream that provides the contents of a string one char at a
 * time.
 */
myjs.Scanner = function(source, settings) {
  this.settings = settings;
  this.source = source;
  this.cursor = 0;
};

myjs.Scanner.prototype.getCurrent = function() {
  return this.source[this.cursor];
};

myjs.Scanner.prototype.getLookahead = function() {
  return this.source[this.cursor + 1];
};

/**
 * Does this character stream have more characters?
 */
myjs.Scanner.prototype.hasMore = function() {
  return this.cursor < this.source.length;
};

myjs.Scanner.prototype.hasLookahead = function() {
  return (this.cursor + 1) < this.source.length;
};

/**
 * Advances the stream to the next character.
 */
myjs.Scanner.prototype.advance = function() {
  this.cursor++;
};

/**
 * Advance the specified amount if possible but not past the end of the
 * input.
 */
myjs.Scanner.prototype.advanceIfPossible = function(amount) {
  this.cursor = Math.min(this.cursor + amount, this.source.length);
};

/**
 * Advances the stream to the next character and returns it.
 */
myjs.Scanner.prototype.advanceAndGet = function() {
  this.cursor++;
  return this.getCurrent();
};

/**
 * Returns the current character offset.
 */
myjs.Scanner.prototype.getCursor = function() {
  return this.cursor;
};

/**
 * Returns the part of the input between 'start' and 'end'.
 */
myjs.Scanner.prototype.getPart = function(start, end) {
  return this.source.substring(start, end);
};

/**
 * Is the given string a single character of whitespace?
 */
function isWhiteSpace(c) {
  return (/\s/).test(c);
}

function isDigit(c) {
  return (/[\d]/).test(c);
}

/**
 * Is this character allowed as the first in an identifier?
 */
function isIdentifierStart(c) {
  return (/[\w]/).test(c);
}

/**
 * Is this character allowed as the first in an identifier?
 */
function isIdentifierPart(c) {
  return (/[\w\d]/).test(c);
}

/**
 * Extracts the next JavaScript token from the given stream.
 */
myjs.Scanner.prototype.scanToken = function() {
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
  if (isWhiteSpace(c)) {
    return this.scanWhiteSpace();
  } else if (this.settings.isPunctuation(c)) {
    return this.scanPunctuation();
  } else if (isDigit(c)) {
    return this.scanNumber(c);
  } else if (isIdentifierStart(c)) {
    return this.scanIdentifier(c);
  } else {
    this.advance();
    return new myjs.SoftToken(c, c);
  }
};

/**
 * Doesn't advance but just returns a token with the given contents.
 */
myjs.Scanner.prototype.justYield = function(value, typeOpt) {
  return new myjs.HardToken(value, typeOpt);
};

/**
 * Skips over the current character and returns a token with the given
 * contents.
 */
myjs.Scanner.prototype.advanceAndYield = function(value, typeOpt) {
  this.advance();
  return new myjs.HardToken(value, typeOpt);
};

/**
 * Skips over the current character and if the next character matches
 * the given 'match' skips another and return 'ifMatch', otherwise
 * doesn't skip but just returns 'ifNoMatch'.
 */
myjs.Scanner.prototype.checkAndYield = function(match, ifMatch, ifNoMatch) {
  if (this.advanceAndGet() == match) {
    this.advance();
    return new myjs.HardToken(ifMatch);
  } else {
    return new myjs.HardToken(ifNoMatch);
  }
};

/**
 * If the next character is 'single', returns onDouble, otherwise if the
 * next is equality returns onAssignment, otherwise returns single.
 */
myjs.Scanner.prototype.doubleOrAssignment = function(single, onDouble,
    onAssignment) {
  switch (this.advanceAndGet()) {
  case single:
    return this.advanceAndYield(onDouble);
  case '=':
    return this.advanceAndYield(onAssignment);
  default:
    return this.justYield(single);
  }
};

/**
 * Scans a single block of whitespace.
 */
myjs.Scanner.prototype.scanWhiteSpace = function() {
  var start = this.getCursor();
  while (this.hasMore() && isWhiteSpace(this.getCurrent())) {
    this.advance();
  }
  var end = this.getCursor();
  return new myjs.SoftToken(this.getPart(start, end));
};

myjs.Scanner.prototype.scanIdentifier = function() {
  var start = this.getCursor();
  while (this.hasMore() && isIdentifierPart(this.getCurrent())) {
    this.advance();
  }
  var end = this.getCursor();
  var value = this.getPart(start, end);
  if (this.settings.isKeyword(value)) {
    return new myjs.HardToken(value);
  } else {
    return new myjs.HardToken(value, 'Identifier');
  }
};

myjs.Scanner.prototype.scanPunctuation = function() {
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
  return new myjs.HardToken(value);
};

myjs.Scanner.prototype.scanNumber = function() {
  var start = this.getCursor();
  while (this.hasMore() && isDigit(this.getCurrent())) {
    this.advance();
  }
  var end = this.getCursor();
  var value = this.getPart(start, end);
  return new myjs.HardToken(value, 'NumericLiteral');
};

myjs.Scanner.prototype.scanString = function() {
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
  return new myjs.HardToken(value, 'StringLiteral');
};

myjs.Scanner.prototype.scanEndOfLineComment = function() {
  var start = this.getCursor();
  while (this.hasMore() && (this.getCurrent() != '\n')) {
    this.advance();
  }
  this.advanceIfPossible(1);
  var end = this.getCursor();
  var value = this.getPart(start, end);
  return new myjs.SoftToken(value);
};

myjs.Scanner.prototype.scanBlockComment = function() {
  var start = this.getCursor();
  while (this.hasLookahead() &&
    (this.getCurrent() != '*' || this.getLookahead() != '/')) {
    this.advance();
  }
  this.advanceIfPossible(2);
  var end = this.getCursor();
  var value = this.getPart(start, end);
  return new myjs.SoftToken(value);
};

/**
 * Returns the tokens of a piece of JavaScript source code.
 */
myjs.tokenize = function(source, settings) {
  var stream = new myjs.Scanner(source, settings);
  var tokens = [];
  while (stream.hasMore()) {
    var next = stream.scanToken();
    tokens.push(next);
  }
  return tokens;
};

myjs.UnparseContext = function(dialect) {
  this.dialect = dialect;
  this.types = dialect.getTypes();
  this.hasPendingNewline = false;
  this.indentLevel = 0;
  this.text = [];
};

myjs.UnparseContext.prototype.indent = function() {
  this.indentLevel++;
  return this;
};

myjs.UnparseContext.prototype.deindent = function() {
  this.indentLevel--;
  return this;
};

myjs.UnparseContext.prototype.newline = function() {
  this.hasPendingNewline = true;
  return this;
};

myjs.UnparseContext.prototype.node = function(ast) {
  var type = ast.type;
  var typeCons = this.types[type];
  if (typeCons) {
    typeCons.prototype.unparse.call(ast, this);
    return this;
  }
  this.write("#<" + type + ">");
  return this;
};

myjs.UnparseContext.prototype.nodes = function(asts, opt_separator) {
  var i;
  for (i = 0; i < asts.length; i++) {
    if (opt_separator && (i > 0)) {
      this.write(opt_separator);
    }
    this.node(asts[i]);
  }
  return this;
};

myjs.UnparseContext.prototype.writes = function(strs, opt_separator) {
  var i;
  for (i = 0; i < strs.length; i++) {
    if (opt_separator && (i > 0)) {
      this.write(opt_separator);
    }
    this.write(strs[i]);
  }
  return this;
};

myjs.UnparseContext.prototype.flushNewline = function() {
  if (this.hasPendingNewline) {
    this.hasPendingNewline = false;
    this.text.push("\n");
    for (var i = 0; i < this.indentLevel; i++) {
      this.text.push("  ");
    }
  }
};

myjs.UnparseContext.prototype.write = function(str) {
  this.flushNewline();
  this.text.push(str);
  return this;
};

myjs.UnparseContext.prototype.flush = function() {
  this.flushNewline();
  return this.text.join("");
};

function registerBuiltInDialects() {
  myjs.registerDialect(new myjs.Dialect('default')
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
  myjs.registerDialect(new myjs.Dialect('meta')
    .extendsDialect('default')
    .addFragment('myjs.Meta'));
}

registerBuiltInDialects();
