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
 * @fileoverview Generic (non js-specific) parser library. The interface is
 * similar to the library described in http://data.quenta.org/tedir.pdf but
 * the implementation is somewhat different.
 */

'use strict';

goog.provide('myjs.tedir');

goog.require('myjs.ast');
goog.require('myjs.utils');

myjs.tedir.internal = {};

/**
 * Signals an internal error in the parser.
 *
 * @param {string} message An error message.
 * @constructor
 */
myjs.tedir.Error = function(message) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, myjs.tedir.Error);
  }
  this.message = message;
};

myjs.tedir.Error.prototype.toString = function() {
  return 'myjs.tedir.Error: ' + this.message;
};

/**
 * Signals that the input could not be parser according to the grammar of
 * this parser.
 *
 * @param {myjs.tedir.SourceOrigin} origin information about the source.
 * @param {Array} input the list of input tokens.
 * @param {number} the index in the input list of the offending token.
 * @constructor
 */
myjs.tedir.SyntaxError = function(origin, input, tokenIndex) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, myjs.tedir.SyntaxError);
  }
  this.origin = origin;
  this.input = input;
  this.tokenIndex = tokenIndex;
};

myjs.tedir.SyntaxError.prototype.getToken = function(index) {
  return this.input.tokens[index].value;
};

myjs.tedir.SyntaxError.prototype.getOffendingToken = function() {
  return this.getToken(this.tokenIndex);
};

myjs.tedir.SyntaxError.prototype.getLineIndex = function() {
  var i, lines = 0;
  for (i = 0; i < this.tokenIndex; i++) {
    var token = this.getToken(i);
    var offset = token.indexOf('\n');
    while (offset != -1) {
      lines++;
      offset = token.indexOf('\n', offset + 1);
    }
  }
  return lines;
};

myjs.tedir.SyntaxError.prototype.toString = function() {
  var token = this.getOffendingToken();
  var locList = [];
  var fileName = this.origin.getFileName();
  if (fileName) {
    locList.push(fileName);
  }
  var lineNumber = this.getLineIndex() + 1;
  locList.push(lineNumber);
  var loc = '(' + locList.join(':') + ')';
  return 'tedir.SyntaxError' + loc + ': Unexpected token ' + token;
};

/**
 * Singleton factory object.
 */
// In general, avoid making any assumptions about what 'this' is when the
// factory methods are called since it may be convenient to call those methods
// other than directly through a reference to 'factory'.
myjs.tedir.factory = {};

myjs.tedir.factory.token = function(value, kindOpt) {
  return new myjs.tedir.Token(value, kindOpt);
};

myjs.tedir.factory.nonterm = function(name) {
  return new myjs.tedir.Nonterm(name);
};

myjs.tedir.factory.custom = function(handler) {
  return new myjs.tedir.Custom(handler);
};

myjs.tedir.factory.seq = function() {
  return new myjs.tedir.Sequence(myjs.utils.toArray(arguments));
};

myjs.tedir.factory.choice = function() {
  return new myjs.tedir.Choice(myjs.utils.toArray(arguments));
};

myjs.tedir.factory.option = function() {
  return myjs.tedir.factory.choice(new myjs.tedir.Sequence(myjs.utils.toArray(arguments)), EMPTY);
};

myjs.tedir.factory.star = function(value, sepOpt) {
  return new myjs.tedir.Repeat(value, sepOpt, true);
};

myjs.tedir.factory.plus = function(value, sepOpt) {
  return new myjs.tedir.Repeat(value, sepOpt, false);
};

myjs.tedir.factory.empty = function() {
  return EMPTY;
};

myjs.tedir.factory.ignore = function(value) {
  return new myjs.tedir.Ignore(value);
};

myjs.tedir.factory.filter = function(body, filter, isConstructor) {
  return new myjs.tedir.Filter(body, filter, isConstructor);
};

myjs.tedir.ERROR_MARKER = {};

myjs.tedir.isError = function(value) {
  return value === myjs.tedir.ERROR_MARKER;
};

/**
 * The abstract supertype for syntax expressions.
 */
myjs.tedir.Expression = function() {
  this.useValueCache = null;
};

myjs.tedir.Expression.prototype.accept = function(visitor) {
  return visitor(this, this.getType());
};

/**
 * If the value of this expression is passed through a filter, how many
 * filter arguments does it correspond to?
 */
myjs.tedir.Expression.prototype.getArity = function() {
  return 1;
};

/**
 * Should the value of this expression be ignored in the result?  Caches
 * its result so calls are O(1).
 */
myjs.tedir.Expression.prototype.useValue = function() {
  if (this.useValueCache === null) {
    this.useValueCache = this.calcUseValue();
  }
  return this.useValueCache;
};

/**
 * Calculates whether the value of this expression should be ignored.
 * Generally, don't call this directly, use useValue so you get caching.
 */
myjs.tedir.Expression.prototype.calcUseValue = function() {
  return true;
};

/**
 * Is this the empty expression?  Note that non-normalized expressions may
 * return false but effectively be the empty expression.
 */
myjs.tedir.Expression.prototype.isEmpty = function() {
  return false;
};

/**
 * An atomic terminal symbol.
 */
myjs.tedir.Token = function(value, kindOpt) {
  myjs.utils.base(this).call(this);

  // What kind of input tokens does this grammar token match?
  this.value = value;

  // If necessary, a value that specified the kind of this token.
  this.kind = kindOpt;
};
goog.inherits(myjs.tedir.Token, myjs.tedir.Expression);

myjs.tedir.Token.prototype.getType = function() {
  return 'TOKEN';
};

myjs.tedir.Token.prototype.getKind = function() {
  return this.kind;
};

myjs.tedir.Token.prototype.forEachChild = function(visitor) {
  // ignore
};

myjs.tedir.Token.prototype.normalize = function() {
  return new myjs.tedir.Token(this.value, this.kind);
};

myjs.tedir.Token.prototype.parse = function(context) {
  var input = context.input;
  var current = input.getCurrent();
  if (current.type == this.value) {
    input.advance();
    return current.value;
  } else {
    return context.getErrorMarker();
  }
};

myjs.tedir.Token.prototype.toString = function() {
  return '"' + this.value + '"';
};

/**
 * A nonterminal reference.
 */
myjs.tedir.Nonterm = function(name) {
  myjs.utils.base(this).call(this);
  this.name = name;
};
goog.inherits(myjs.tedir.Nonterm, myjs.tedir.Expression);

myjs.tedir.Nonterm.prototype.getType = function() {
  return 'NONTERM';
};

myjs.tedir.Nonterm.prototype.forEachChild = function(visitor) {
  // ignore
};

myjs.tedir.Nonterm.prototype.normalize = function() {
  return new myjs.tedir.Nonterm(this.name);
};

myjs.tedir.Nonterm.prototype.parse = function(context) {
  var grammar = context.parser.grammar;
  return grammar.getNonterm(this.name).parse(context);
};

myjs.tedir.Nonterm.prototype.toString = function() {
  return '<' + this.name + '>';
};

/**
 * Abstract supertype for handlers that define how user-defined expressions
 * parse input.
 */
myjs.tedir.CustomHandler = function() { };

/**
 * Invokes the given callback for each child element under this expression.
 */
myjs.tedir.CustomHandler.prototype.forEachChild = function(callback) {
  // no children by default
};

/**
 * If this handler has subexpressions, must return a new handler with each
 * subexpression t replaced by t.normalize(). Otherwise this handler should
 * be returned.
 */
myjs.tedir.CustomHandler.prototype.normalize = function() {
  // No normalization
  return this;
};

/**
 * Subtypes must implement this method to parse input from the given context.
 */
myjs.tedir.CustomHandler.prototype.parse = function(context) {
  throw new Error('Abstract method called');
};

/**
 * A custom user-defined parser expression.
 */
myjs.tedir.Custom = function(handler) {
  this.handler = handler;
};
goog.inherits(myjs.tedir.Custom, myjs.tedir.Expression);

myjs.tedir.Custom.prototype.getType = function() {
  return 'CUSTOM';
};

myjs.tedir.Custom.prototype.forEachChild = function(callback) {
  this.handler.forEachChild(callback);
};

myjs.tedir.Custom.prototype.normalize = function() {
  return new myjs.tedir.Custom(this.handler.normalize());
};

myjs.tedir.Custom.prototype.parse = function(context) {
  return this.handler.parse(context);
};

/**
 * A sequence of expressions.
 */
myjs.tedir.Sequence = function(terms) {
  myjs.utils.base(this).call(this);
  this.terms = terms;
};
goog.inherits(myjs.tedir.Sequence, myjs.tedir.Expression);

myjs.tedir.Sequence.prototype.getType = function() {
  return 'SEQUENCE';
};

myjs.tedir.Sequence.prototype.forEachChild = function(visitor) {
  this.terms.forEach(visitor);
};

myjs.tedir.Sequence.prototype.toString = function() {
  return '(: ' + this.terms.join(' ') + ')';
};

myjs.tedir.Sequence.prototype.parse = function(context) {
  var i, values = [];
  for (i = 0; i < this.terms.length; i++) {
    var term = this.terms[i];
    var value = term.parse(context);
    if (myjs.tedir.isError(value)) {
      return context.getErrorMarker();
    } else if (term.useValue()) {
      values.push(value);
    }
  }
  switch (values.length) {
  case 0:
    return null;
  case 1:
    return values[0];
  default:
    return values;
  }
};

myjs.tedir.Sequence.prototype.getArity = function() {
  var result = 0;
  this.terms.forEach(function(term) {
    if (term.useValue()) {
      result++;
    }
  });
  return result;
};

myjs.tedir.Sequence.prototype.calcUseValue = function() {
  var i, result = false;
  for (i = 0; i < this.terms.length; i++) {
    if (this.terms[i].useValue()) {
      return true;
    }
  }
  return false;
};

myjs.tedir.Sequence.prototype.normalize = function() {
  var normalTerms = [];
  this.terms.forEach(function(term) {
    var normalTerm = term.normalize();
    // Ignore the empty terminal.
    if (!normalTerm.isEmpty()) {
      normalTerms.push(normalTerm);
    }
  });
  if (normalTerms.length == 0) {
    return EMPTY;
  } else if (normalTerms.length == 1) {
    return normalTerms[0];
  } else {
    return new myjs.tedir.Sequence(normalTerms);
  }
};

/**
 * An unordered choice between expressions.
 */
myjs.tedir.Choice = function(terms) {
  myjs.utils.base(this).call(this);
  this.terms = terms;
};
goog.inherits(myjs.tedir.Choice, myjs.tedir.Expression);

myjs.tedir.Choice.prototype.getType = function() {
  return 'CHOICE';
};

myjs.tedir.Choice.prototype.addOption = function(term) {
  this.terms.push(term);
};

myjs.tedir.Choice.prototype.toString = function() {
  return '(| ' + this.terms.join(' ') + ')';
};

myjs.tedir.Choice.prototype.parse = function(context) {
  var i, start = context.input.getCursor();
  for (i = 0; i < this.terms.length; i++) {
    var term = this.terms[i];
    var result = term.parse(context);
    if (myjs.tedir.isError(result)) {
      context.input.rewind(start);
    } else {
      return result;
    }
  }
  return context.getErrorMarker();
};

myjs.tedir.Choice.prototype.forEachChild = function(visitor) {
  this.terms.forEach(visitor);
};

function normalizeAll(terms) {
  return terms.map(function(t) { return t.normalize(); });
}

myjs.tedir.Choice.prototype.normalize = function() {
  if (this.terms.length == 1) {
    return this.terms[0].normalize();
  } else {
    return new myjs.tedir.Choice(normalizeAll(this.terms));
  }
};

/**
 * The empty expression that trivially matches everything.
 */
myjs.tedir.Empty = function() {
  myjs.utils.base(this).call(this);
};
goog.inherits(myjs.tedir.Empty, myjs.tedir.Expression);

var EMPTY = new myjs.tedir.Empty();

myjs.tedir.Empty.prototype.getType = function() {
  return 'EMPTY';
};

myjs.tedir.Empty.prototype.forEachChild = function(visitor) {
  // ignore
};

myjs.tedir.Empty.prototype.isEmpty = function() {
  return true;
};

myjs.tedir.Empty.prototype.normalize = function() {
  return this;
};

myjs.tedir.Empty.prototype.parse = function(context) {
  return null;
};

myjs.tedir.Empty.prototype.calcUseValue = function() {
  return false;
};

myjs.tedir.Empty.prototype.toString = function() {
  return '.';
};

/**
 * A marker that ensures that the value of the given subexpression will
 * not be included in the resulting concrete syntax tree.
 */
myjs.tedir.Ignore = function(term) {
  myjs.utils.base(this).call(this);
  this.term = term;
};
goog.inherits(myjs.tedir.Ignore, myjs.tedir.Expression);

myjs.tedir.Ignore.prototype.getType = function() {
  return 'IGNORE';
};

myjs.tedir.Ignore.prototype.forEachChild = function(visitor) {
  visitor(this.term);
};

myjs.tedir.Ignore.prototype.parse = function(context) {
  var value = this.term.parse(context);
  return myjs.tedir.isError(value) ? value : null;
};

myjs.tedir.Ignore.prototype.normalize = function() {
  return new myjs.tedir.Ignore(this.term.normalize());
};

myjs.tedir.Ignore.prototype.calcUseValue = function() {
  return false;
};

myjs.tedir.Ignore.prototype.toString = function() {
  return '(_ ' + this.term + ')';
};

myjs.tedir.Filter = function(term, filter, isConstructor, arityOpt) {
  this.term = term;
  this.filter = filter;
  this.isConstructor = isConstructor;
  var arity = (arityOpt === undefined) ? -1 : arityOpt;
  this.arity = arity;
  this.invoker = myjs.tedir.Invoker.forArity(arity, this.isConstructor, this.filter);
};
goog.inherits(myjs.tedir.Filter, myjs.tedir.Expression);

myjs.tedir.Filter.prototype.getType = function() {
  return 'FILTER';
};

myjs.tedir.Filter.prototype.forEachChild = function(visitor) {
  visitor(this.term);
};

myjs.tedir.Filter.prototype.parse = function(context) {
  var value = this.term.parse(context);
  return myjs.tedir.isError(value) ? value : (this.invoker)(value);
};

myjs.tedir.Filter.prototype.normalize = function() {
  var term = this.term.normalize();
  var arity = (this.arity === -1) ? term.getArity() : this.arity;
  return new myjs.tedir.Filter(this.term.normalize(), this.filter, this.isConstructor,
    arity);
};

/**
 * Utility function for invoking functions with a given arity.
 */
myjs.tedir.Invoker = function() { };

myjs.tedir.Invoker.forArity = function(arity, isConstructor, fun) {
  if (arity == -1) {
    return null;
  } else if (isConstructor) {
    return myjs.tedir.Invoker.constructorForArity(fun, arity);
  } else {
    return myjs.tedir.Invoker.callerForArity(fun, arity);
  }
};

/**
 * Returns a function that, when called with an arguments array (that is,
 * a real array of arguments not an arguments object) calls the given
 * function in the appropriate way for passing it 'arity' arguments.
 */
myjs.tedir.Invoker.callerForArity = function(fun, arity) {
  switch (arity) {
  case 1:
    return function(args) { return fun(args); };
  default:
    return function(args) { return fun.apply(null, args); };
  }
};

myjs.tedir.Invoker.constructorBridges = [];
myjs.tedir.Invoker.constructorForArity = function(Cons, arity) {
  if (arity == 1) {
    return function(args) { return new Cons(args); };
  } else {
    var bridgeBuilder = myjs.tedir.Invoker.constructorBridges[arity];
    if (!bridgeBuilder) {
      bridgeBuilder = myjs.tedir.Invoker.buildConstructorBridge(arity);
      myjs.tedir.Invoker.constructorBridges[arity] = bridgeBuilder;
    }
    return bridgeBuilder(Cons);
  }
};

/**
 * Constructs a function that calls a function with a specified number
 * of arguments, taken from a list.
 */
myjs.tedir.Invoker.buildConstructorBridge = function(arity) {
  var i, params = [];
  for (i = 0; i < arity; i++) {
    params.push('args[' + i + ']');
  }
  var source = 'return new Cons(' + params.join(', ') + ');';
  var FunctionConstructor = Function;
  // Apparently jslint doesn't support suppressing individual warnings to
  // we have to trick it instead.
  var bridge = new FunctionConstructor('Cons', 'args', source);
  return function(Cons) {
    return function(args) {
      return bridge(Cons, args);
    };
  };
};

/**
 * A repetition of an expression, separated by a separator expression.
 */
myjs.tedir.Repeat = function(body, sepOpt, allowEmpty) {
  myjs.utils.base(this).call(this);
  this.body = body;
  this.sep = sepOpt || EMPTY;
  this.allowEmpty = allowEmpty;
};
goog.inherits(myjs.tedir.Repeat, myjs.tedir.Expression);

myjs.tedir.Repeat.prototype.getType = function() {
  return 'REPEAT';
};

myjs.tedir.Repeat.prototype.forEachChild = function(visitor) {
  visitor(this.body);
  visitor(this.sep);
};

myjs.tedir.Repeat.prototype.normalize = function() {
  return new myjs.tedir.Repeat(this.body.normalize(), this.sep.normalize(),
      this.allowEmpty);
};

myjs.tedir.Repeat.prototype.parse = function(context) {
  var input = context.input;
  var start = input.getCursor();
  var body = this.body;
  var sep = this.sep;
  var first = body.parse(context);
  if (myjs.tedir.isError(first)) {
    if (this.allowEmpty) {
      input.rewind(start);
      return [];
    } else {
      return context.getErrorMarker();
    }
  } else {
    var results = [];
    if (body.useValue()) {
      results.push(first);
    }
    while (true) {
      start = input.getCursor();
      var sepValue = sep.parse(context);
      if (myjs.tedir.isError(sepValue)) {
        input.rewind(start);
        break;
      } else {
        var bodyValue = body.parse(context);
        if (myjs.tedir.isError(bodyValue)) {
          input.rewind(start);
          break;
        } else {
          if (sep.useValue()) {
            results.push(sepValue);
          }
          if (body.useValue()) {
            results.push(bodyValue);
          }
        }
      }
    }
    return results;
  }
};

myjs.tedir.Repeat.prototype.toString = function() {
  return '(' + (this.allowEmpty ? '* ' : '+ ') + this.body + ' ' + this.sep +
    ')';
};

myjs.tedir.Operator = function(value) {
  this.value = value;
  this.infixPrecedence = -1;
  this.prefixPrecedence = -1;
  this.suffixPrecedence = -1;
};

myjs.tedir.OperatorTable = function() {
  this.ops = {};
};

myjs.tedir.Operators = function(body, table) {
  this.body = body;
  this.table = table;
};

/**
 * Abstract supertype for grammar and syntax objects.
 */
myjs.tedir.GrammarOrSyntax = function() { };

/**
 * Abstract supertype for syntaxes.
 */
myjs.tedir.AbstractSyntax = function() { };
goog.inherits(myjs.tedir.AbstractSyntax, myjs.tedir.GrammarOrSyntax);

/**
 * Returns a syntax that contains the same rules as this syntax
 * and the one passed as the argument.
 */
myjs.tedir.AbstractSyntax.prototype.compose = function(members) {
  return new myjs.tedir.CompositeSyntax([this].concat(members));
};

/**
 * Invokes the callback for each rule defined in this grammar.
 */
myjs.tedir.AbstractSyntax.prototype.forEachRule = function(callback) {
  this.getRuleNames().forEach(function(name) {
    callback(name, this.getRule(name).asExpression());
  }.bind(this));
};

/**
 * Returns a new grammar that represents this syntax.
 */
myjs.tedir.AbstractSyntax.prototype.asGrammar = function() {
  return new myjs.tedir.Grammar(this);
};

/**
 * A (potentially partial) syntax definition. A number of syntaxes together
 * can be compiled into a grammar.
 */
myjs.tedir.LiteralSyntax = function() {
  this.rules = {};
};
goog.inherits(myjs.tedir.LiteralSyntax, myjs.tedir.AbstractSyntax);

myjs.tedir.LiteralSyntax.prototype.toString = function() {
  var getPair = function(k) {
    return k + ': ' + this.rules[k];
  }.bind(this);
  return 'grammar { ' + this.getRuleNames().map(getPair).join(', ') + ' } ';
};

myjs.tedir.LiteralSyntax.prototype.getRuleNames = function() {
  return Object.keys(this.rules);
};

/**
 * Adds the given expression as a possible production for the given name.
 */
myjs.tedir.LiteralSyntax.prototype.getRule = function(name, failIfMissingOpt) {
  if (!(this.rules.hasOwnProperty(name))) {
    if (failIfMissingOpt) {
      throw new myjs.tedir.Error('Undefined nonterminal <' + name + '>');
    } else {
      this.rules[name] = new myjs.tedir.Rule([]);
    }
  }
  return this.rules[name];
};

myjs.tedir.CompositeSyntax = function(members) {
  this.members = members;
  this.ruleCache = null;
};
goog.inherits(myjs.tedir.CompositeSyntax, myjs.tedir.AbstractSyntax);

myjs.tedir.CompositeSyntax.prototype.getRuleNames = function() {
  return Object.keys(this.getRules());
};

myjs.tedir.CompositeSyntax.prototype.getRule = function(name, failIfMissingOpt) {
  var rules = this.getRules();
  if (!(rules.hasOwnProperty(name))) {
    throw new myjs.tedir.Error('Undefined nonterminal <' + name + '>');
  }
  return rules[name];
};

myjs.tedir.CompositeSyntax.prototype.getRules = function() {
  if (!this.ruleCache) {
    var ruleLists = {};
    this.members.forEach(function(member) {
      member.getRuleNames().forEach(function(name) {
        if (!ruleLists.hasOwnProperty(name)) {
          ruleLists[name] = [];
        }
        ruleLists[name].push(member.getRule(name));
      });
    });
    this.ruleCache = {};
    Object.keys(ruleLists).forEach(function(name) {
      this.ruleCache[name] = myjs.tedir.Rule.merge(ruleLists[name]);
    }.bind(this));
  }
  return this.ruleCache;
};

/**
 * A single production.
 */
myjs.tedir.Production = function(value) {
  this.value = value;
  this.filter = null;
};

myjs.tedir.Production.prototype.asExpression = function() {
  if (this.filter) {
    return myjs.tedir.factory.filter(this.value, this.filter.fun,
      this.filter.isConstructor);
  } else {
    return this.value;
  }
};

/**
 * The "value" of a nonterm, the productions the nonterm expands to.
 */
myjs.tedir.Rule = function(prods) {
  this.prods = prods;
  this.exprCache = null;
};

/**
 * Merges the given rules into a single rule with the union of all the
 * productions.
 */
myjs.tedir.Rule.merge = function(rules) {
  if (rules.length == 1) {
    return rules[0];
  } else {
    var prods = [];
    rules.forEach(function(rule) {
      prods = prods.concat(rule.prods);
    });
    return new myjs.tedir.Rule(prods);
  }
};

/**
 * Returns the last production that was added.
 */
myjs.tedir.Rule.prototype.getLastProd = function() {
  return this.prods[this.prods.length - 1];
};

/**
 * Adds a new production to this rule.
 */
myjs.tedir.Rule.prototype.addProd = function() {
  this.prods.push(new myjs.tedir.Production(new myjs.tedir.Sequence(myjs.utils.toArray(arguments))));
  return this;
};

/**
 * Sets the constructor function that should be instantiated when the last
 * production that was added succeeds during parsing.
 */
myjs.tedir.Rule.prototype.setConstructor = function(Constructor) {
  return this.setHandler(Constructor, true);
};

/**
 * Sets the function that should be called when the last production that
 * was added succeeds during parsing.
 */
myjs.tedir.Rule.prototype.setHandler = function(handler, isConstructor) {
  this.getLastProd().filter = {fun: handler, isConstructor: isConstructor};
  return this;
};

myjs.tedir.Rule.prototype.asExpression = function() {
  if (!this.exprCache) {
    var prodExprs = this.prods.map(function(p) {return p.asExpression(); });
    this.exprCache = new myjs.tedir.Choice(prodExprs);
  }
  return this.exprCache;
};

/**
 * A fixed immutable grammar. Where syntaxes are (or at least can be)
 * fragments that have to be joined together to be complete, a grammar
 * is always complete.
 */
myjs.tedir.Grammar = function(syntax) {
  this.syntax = syntax;
  this.nonterms = {};
};

/**
 * Returns true if this grammar is valid.
 */
myjs.tedir.Grammar.prototype.isValid = function() {
  return true;
};

/**
 * Convenience method that allows syntaxes and grammars to be treated
 * uniformly.
 */
myjs.tedir.Grammar.prototype.asGrammar = function() {
  return this;
};

/**
 * Returns the local nonterminal with the given name, building it the
 * first time the method is called.
 */
myjs.tedir.Grammar.prototype.getNonterm = function(name) {
  var value = this.nonterms[name];
  if (!value) {
    value = this.buildNonterm(name);
    this.nonterms[name] = value;
  }
  return value;
};

/**
 * Returns a normalized local expression for the given that only this grammar
 * will use.
 */
myjs.tedir.Grammar.prototype.buildNonterm = function(name) {
  var rule = this.syntax.getRule(name, true);
  return rule.asExpression().normalize();
};

var EOF_TOKEN = new myjs.tedir.Token('eof');

/**
 * A stream of tokens with information about the current position.
 */
myjs.tedir.TokenStream = function(tokens, traceOut) {
  this.tokens = tokens;
  this.cursor = 0;
  this.highWaterMark = 0;
  this.traceOut = traceOut;
  this.skipEther();
};

/**
 * Returns the current token.
 */
myjs.tedir.TokenStream.prototype.getCurrent = function() {
  if (this.hasMore()) {
    return this.tokens[this.cursor];
  } else {
    return EOF_TOKEN;
  }
};

/**
 * Does this stream have more tokens?
 */
myjs.tedir.TokenStream.prototype.hasMore = function() {
  return this.cursor < this.tokens.length;
};

myjs.tedir.TokenStream.prototype.skipEther = function() {
  while (this.hasMore() && this.getCurrent().isSoft()) {
    this.cursor++;
  }
  if (this.cursor > this.highWaterMark) {
    this.highWaterMark = this.cursor;
  }
  if (this.traceOut) {
    this.traceOut.push(this.cursor);
  }
};

myjs.tedir.TokenStream.prototype.advance = function() {
  this.cursor++;
  this.skipEther();
};

myjs.tedir.TokenStream.prototype.getCursor = function() {
  return this.cursor;
};

myjs.tedir.TokenStream.prototype.rewind = function(value) {
  this.cursor = value;
};

/**
 * A collection of information about a parse process.
 */
myjs.tedir.ParseContext = function(parser, input) {
  this.parser = parser;
  this.input = input;
};

/**
 * Returns the token stream currently being parsed.
 */
myjs.tedir.ParseContext.prototype.getTokenStream = function() {
  return this.input;
};

/**
 * Returns the token stream of input.
 */
myjs.tedir.ParseContext.prototype.getInput = function() {
  return this.input;
};

/**
 * Returns the sentinel object used to signal that parsing failed.
 */
myjs.tedir.ParseContext.prototype.getErrorMarker = function() {
  return myjs.tedir.ERROR_MARKER;
};

/**
 * Information about where a given piece of source code comes from.
 *
 * @param {string=} opt_fileName The name of the source file.
 * @constructor
 */
myjs.tedir.SourceOrigin = function(opt_fileName) {
  this.fileName = opt_fileName;
};

myjs.tedir.SourceOrigin.prototype.getFileName = function() {
  return this.fileName;
};

/**
 * Creates a new parser that can be used to parse the given sequence of
 * tokens.
 */
myjs.tedir.Parser = function(grammarOrSyntax) {
  this.grammar = grammarOrSyntax.asGrammar();
};

/**
 * A collection of information about the process of parsing one piece
 * of input.
 */
myjs.tedir.ParseTrace = function(steps, tokens, result) {
  this.steps = steps;
  this.tokens = tokens;
  this.result = result;
};

myjs.tedir.ParseTrace.prototype.isError = function() {
  return this.result instanceof myjs.tedir.SyntaxError;
};

/**
 * Parses the given tokens according to this parser's grammar. If traceOpt
 * is set a trace of the parsing is returned, otherwise just the result.
 */
myjs.tedir.Parser.prototype.parse = function(nonterm, tokens, originOpt, traceOpt) {
  var origin = originOpt || new myjs.tedir.SourceOrigin();
  var start = this.grammar.getNonterm(nonterm);
  var steps = traceOpt ? [] : null;
  var stream = new myjs.tedir.TokenStream(tokens, steps);
  var context = new myjs.tedir.ParseContext(this, stream);
  var result = start.parse(context);
  var error = (myjs.tedir.isError(result) || stream.hasMore()) ?
      new myjs.tedir.SyntaxError(origin, stream, stream.highWaterMark) : null;
  if (traceOpt) {
    return new myjs.tedir.ParseTrace(steps, tokens, error || result);
  } else if (myjs.tedir.isError(result) || stream.hasMore()) {
    throw error;
  } else {
    return result;
  }
};
