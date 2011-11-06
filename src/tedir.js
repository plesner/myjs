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

/**
 * @name myjs.tedir
 * @namespace
 */
goog.provide('myjs.tedir');

goog.require('myjs.ast');
goog.require('myjs.utils');

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

goog.exportSymbol('myjs.tedir.Error', myjs.tedir.Error);

/**
 * @inheritDoc
 */
myjs.tedir.Error.prototype.toString = function() {
  return 'myjs.tedir.Error: ' + this.message;
};

/**
 * Signals that the input could not be parser according to the grammar of
 * this parser.
 *
 * @param {myjs.tedir.SourceOrigin} origin information about the source.
 * @param {myjs.tedir.TokenStream} input the list of input tokens.
 * @param {number} tokenIndex the index in the input list of the offending
 *   token.
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

goog.exportSymbol('myjs.tedir.SyntaxError', myjs.tedir.SyntaxError);

/**
 * Returns the index'th token of the input.
 *
 * @param {number} index which token to return?
 * @return {string} the index'th token's value.
 * @private
 */
myjs.tedir.SyntaxError.prototype.getToken_ = function(index) {
  var tokens = this.input.tokens;
  return index < tokens.length ? tokens[index].value : "<eof>";
};

/**
 * Returns the token that caused the error.
 *
 * @return {string} the offending token.
 */
myjs.tedir.SyntaxError.prototype.getOffendingToken = function() {
  return this.getToken_(this.tokenIndex);
};

/**
 * Returns the line of input where this error occurred.
 *
 * @return {number} the line where the error occurred.
 */
myjs.tedir.SyntaxError.prototype.getLineIndex = function() {
  var i, lines = 0;
  for (i = 0; i < this.tokenIndex; i++) {
    var token = this.getToken_(i);
    var offset = token.indexOf('\n');
    while (offset != -1) {
      lines++;
      offset = token.indexOf('\n', offset + 1);
    }
  }
  return lines;
};

/**
 * @inheritDoc
 */
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

// In general, avoid making any assumptions about what 'this' is when the
// factory methods are called since it may be convenient to call those methods
// other than directly through a reference to 'factory'.
/**
 * Singleton factory object.
 * @const
 */
myjs.tedir.factory = {};

/**
 * Returns an expression that matches exactly the given token in the
 * input, otherwise fails. The value will be the value of the token.
 *
 * @param {string} value the value of the token to match.
 * @param {string=} opt_kind optional marker that other libraries can use;
 *   not used or interpreted by tedir.
 * @return {myjs.tedir.Expression} an expression matching exactly tokens
 *   with the given value.
 */
myjs.tedir.factory.token = function(value, opt_kind) {
  return new myjs.tedir.Terminal_(value, opt_kind);
};

/**
 * Returns an expression that matches using the nonterm with the given name.
 *
 * @param {string} name the name of the nonterm.
 * @return {myjs.tedir.Expression} an expression matching according to the
 *   given nonterm.
 */
myjs.tedir.factory.nonterm = function(name) {
  return new myjs.tedir.Nonterm_(name);
};

/**
 * Returns an expression that uses the given custom handler to parse input.
 *
 * @param {myjs.tedir.CustomHandler} handler the custom parse handler to use.
 * @return {myjs.tedir.Expression} an expression matching according to the
 *   handler.
 */
myjs.tedir.factory.custom = function(handler) {
  return new myjs.tedir.Custom_(handler);
};

/**
 * Returns an expression that matches the given subexpressions in sequence.
 * The value will either be null if there are no non-ignored subexpressions,
 * the value of the one non-ignored subexpression if there is exactly one,
 * or an array of the non-ignored subexpressions if there are more.
 *
 * @param {...myjs.tedir.Expression} var_args a sequence of expressions.
 * @return {myjs.tedir.Expression} an expression that matches the given
 *   subexpressions in sequence.
 */
myjs.tedir.factory.seq = function(var_args) {
  return new myjs.tedir.Sequence_(myjs.utils.toArray(arguments));
};

/**
 * Returns an expression that matches one of the given subexpressions and
 * yields the value of that subexpression.
 *
 * @param {...myjs.tedir.Expression} var_args a sequence of expression.
 * @return {myjs.tedir.Expression} an expression matching any of the given
 *   subexpressions.
 */
myjs.tedir.factory.choice = function(var_args) {
  return new myjs.tedir.Choice_(myjs.utils.toArray(arguments));
};

/**
 * Returns an expression that either matches the given sequence of expressions
 * or nothing.
 *
 * @param {...myjs.tedir.Expression} var_args a sequence of expressions.
 * @return {myjs.tedir.Expression} an expression matching either the given
 *   sequence or nothing.
 */
myjs.tedir.factory.option = function(var_args) {
  var exprs = myjs.utils.toArray(arguments);
  return myjs.tedir.factory.choice(new myjs.tedir.Sequence_(exprs),
    myjs.tedir.factory.empty());
};

/**
 * Returns an expression that matches a possibly empty sequence of body
 * expression, optionally separated by a separator.
 *
 * @param {myjs.tedir.Expression} body the expression to repeat.
 * @param {myjs.tedir.Expression=} opt_sep optional separator expression.
 * @return {myjs.tedir.Expression} an expression representing a possibly
 *   empty sequence of the body, optionally separated by a separator.
 */
myjs.tedir.factory.star = function(body, opt_sep) {
  return new myjs.tedir.Repeat_(body, opt_sep, true);
};

/**
 * Returns an expression that matches a nonempty sequence of body expression,
 * optionally separated by a separator.
 *
 * @param {myjs.tedir.Expression} body the expression to repeat.
 * @param {myjs.tedir.Expression=} opt_sep optional separator expression.
 * @return {myjs.tedir.Expression} an expression representing a nonempty
 *   sequence of the body, optionally separated by a separator.
 */
myjs.tedir.factory.plus = function(body, opt_sep) {
  return new myjs.tedir.Repeat_(body, opt_sep, false);
};

/**
 * Returns the empty expression that trivially succeeds without consuming
 * any input.
 *
 * @return {myjs.tedir.Expression} the empty expression.
 */
myjs.tedir.factory.empty = function() {
  return myjs.tedir.Empty_.INSTANCE;
};

/**
 * Returns an expression that is identical to the given subexpression but
 * whose value is discarded when constructing the resulting syntax tree.
 *
 * @param {myjs.tedir.Expression} body the subexpression.
 * @return {myjs.tedir.Expression} an expression identical to the given
 *   subexpression but with no value.
 */
myjs.tedir.factory.ignore = function(body) {
  return new myjs.tedir.Ignore_(body);
};

/**
 * Returns a new expression that first parses the body and then invokes the
 * given filter function, the result of which will be the result of the whole
 * expression.
 *
 * @param {myjs.tedir.Expression} body the body of this ignore expression.
 * @param {function(...):*} filter the filter function to pass the result
 *   through.
 * @param {boolean} isConstructor invoke the filter as a constructor?
 * @return {myjs.tedir.Expression} the resulting filter expression.
 */
myjs.tedir.factory.filter = function(body, filter, isConstructor) {
  return new myjs.tedir.Filter_(body, filter, isConstructor);
};

/**
 * The singleton error marker.
 * @type {Object}
 * @private
 */
myjs.tedir.ERROR_MARKER_ = {};

/**
 * The abstract supertype for syntax expressions.
 *
 * @constructor
 */
myjs.tedir.Expression = function() {
  this.useValueCache = null;
};

/**
 * Invoke the visitor function for each child expression.
 *
 * @param {function(myjs.tedir.Expression):*} visitor the callback to invoke.
 */
myjs.tedir.Expression.prototype.forEachChild = goog.abstractMethod;

/**
 * Parse input from the given context according to this expression.
 *
 * @param {myjs.tedir.ParseContext} context the current parse context.
 * @return {*} the value of the parsed expression.
 */
myjs.tedir.Expression.prototype.parse = goog.abstractMethod;

/**
 * Normalize this expression.
 *
 * @return {myjs.tedir.Expression} a normalized version of this expression.
 * @protected
 */
myjs.tedir.Expression.prototype.normalize = goog.abstractMethod;

/**
 * Returns the type string of this expression.
 *
 * @return {string} the string type of this expression.
 */
myjs.tedir.Expression.prototype.getType = goog.abstractMethod;

/**
 * If the value of this expression is passed through a filter, how many
 * filter arguments does it correspond to?
 *
 * @return {number} the number of subvalues this expression yields.
 */
myjs.tedir.Expression.prototype.getArity = function() {
  return 1;
};

/**
 * Should the value of this expression be ignored in the result?  Caches
 * its result so calls, except the initial one, are O(1).
 *
 * @return {boolean} true iff the value of this expression should be included
 *   in the resulting syntax tree.
 */
myjs.tedir.Expression.prototype.useValue = function() {
  if (this.useValueCache === null) {
    this.useValueCache = this.calcUseValue();
  }
  return !!this.useValueCache;
};

/**
 * Calculates whether the value of this expression should be ignored.
 * Generally, don't call this directly, use useValue so you get caching.
 *
 * @return {boolean} true iff the value of this expression should be included
 *   in the resulting syntax tree.
 */
myjs.tedir.Expression.prototype.calcUseValue = function() {
  return true;
};

/**
 * Is this the empty expression?  Note that non-normalized expressions may
 * return false but effectively be the empty expression.
 *
 * @return {boolean} true iff this is the empty expression.
 */
myjs.tedir.Expression.prototype.isEmpty = function() {
  return false;
};

/**
 * An atomic terminal symbol.
 *
 * @param {string} value the value of this token, for instance "==" or
 *   "Identifier".
 * @param {*=} opt_kind an optional marker that can be used by tools
 *   built on top of tedir. Not used or interpreted by tedir.
 * @constructor
 * @extends myjs.tedir.Expression
 * @private
 */
myjs.tedir.Terminal_ = function(value, opt_kind) {
  myjs.utils.base(this).call(this);
  this.value = value;
  this.kind = opt_kind;
};
goog.inherits(myjs.tedir.Terminal_, myjs.tedir.Expression);

/**
 * @inheritDoc
 */
myjs.tedir.Terminal_.prototype.getType = function() {
  return 'TOKEN';
};

/**
 * Returns this terminal's kind.
 *
 * @return {*} the kind value of this terminal.
 */
myjs.tedir.Terminal_.prototype.getKind = function() {
  return this.kind;
};

/**
 * @inheritDoc
 */
myjs.tedir.Terminal_.prototype.forEachChild = function(visitor) {
  // ignore
};

/**
 * @inheritDoc
 */
myjs.tedir.Terminal_.prototype.normalize = function() {
  return new myjs.tedir.Terminal_(this.value, this.kind);
};

/**
 * @inheritDoc
 */
myjs.tedir.Terminal_.prototype.parse = function(context) {
  var input = context.input;
  var current = input.getCurrent();
  if (current.type == this.value) {
    input.advance();
    return current.value;
  } else {
    return context.getErrorMarker();
  }
};

/**
 * @inheritDoc
 */
myjs.tedir.Terminal_.prototype.toString = function() {
  return '"' + this.value + '"';
};

/**
 * A nonterminal reference.
 *
 * @param {string} name the name of the nonterminal to use.
 * @constructor
 * @extends myjs.tedir.Expression
 * @private
 */
myjs.tedir.Nonterm_ = function(name) {
  myjs.utils.base(this).call(this);
  this.name = name;
};
goog.inherits(myjs.tedir.Nonterm_, myjs.tedir.Expression);

/**
 * @inheritDoc
 */
myjs.tedir.Nonterm_.prototype.getType = function() {
  return 'NONTERM';
};

/**
 * @inheritDoc
 */
myjs.tedir.Nonterm_.prototype.forEachChild = function(visitor) {
  // ignore
};

/**
 * @inheritDoc
 */
myjs.tedir.Nonterm_.prototype.normalize = function() {
  return new myjs.tedir.Nonterm_(this.name);
};

/**
 * @inheritDoc
 */
myjs.tedir.Nonterm_.prototype.parse = function(context) {
  var grammar = context.parser.grammar;
  return grammar.getNonterm(this.name).parse(context);
};

/**
 * @inheritDoc
 */
myjs.tedir.Nonterm_.prototype.toString = function() {
  return '<' + this.name + '>';
};

/**
 * Abstract supertype for handlers that define how user-defined expressions
 * parse input.
 *
 * @constructor
 */
myjs.tedir.CustomHandler = function() { };

goog.exportSymbol('myjs.tedir.CustomHandler', myjs.tedir.CustomHandler);

/**
 * Invoke the given callback for each child element under this expression.
 *
 * @param {function(myjs.tedir.Expression):*} callback the function to invoke.
 */
myjs.tedir.CustomHandler.prototype.forEachChild = function(callback) {
  // no children by default
};

goog.exportProperty(myjs.tedir.CustomHandler.prototype, 'forEachChild',
  myjs.tedir.CustomHandler.prototype.forEachChild);

/**
 * If this handler has subexpressions, must return a new handler with each
 * subexpression t replaced by t.normalize(). Otherwise this handler should
 * be returned.
 *
 * @return {myjs.tedir.CustomHandler} a normalized version of this handler.
 */
myjs.tedir.CustomHandler.prototype.normalize = function() {
  // No normalization
  return this;
};

goog.exportProperty(myjs.tedir.CustomHandler.prototype, 'normalize',
  myjs.tedir.CustomHandler.prototype.normalize);

/**
 * Subtypes must implement this method to parse input from the given context.
 *
 * @param {myjs.tedir.ParseContext} context the current parse context which
 *   provides access to the input and current state.
 * @return {*} the value of this expression or the failure marker
 *   (see {@link myjs.tedir.ParseContext#getErrorMarker}) if parsing failed.
 */
myjs.tedir.CustomHandler.prototype.parse = function(context) {
  throw new Error('Abstract method called');
};

/**
 * A custom user-defined parser expression.
 *
 * @param {myjs.tedir.CustomHandler} handler the custom handler that
 *   constrols how to parse input.
 * @constructor
 * @extends myjs.tedir.Expression
 * @private
 */
myjs.tedir.Custom_ = function(handler) {
  this.handler = handler;
};
goog.inherits(myjs.tedir.Custom_, myjs.tedir.Expression);

/**
 * @inheritDoc
 */
myjs.tedir.Custom_.prototype.getType = function() {
  return 'CUSTOM';
};

/**
 * @inheritDoc
 */
myjs.tedir.Custom_.prototype.forEachChild = function(callback) {
  this.handler.forEachChild(callback);
};

/**
 * @inheritDoc
 */
myjs.tedir.Custom_.prototype.normalize = function() {
  return new myjs.tedir.Custom_(this.handler['normalize']());
};

/**
 * @inheritDoc
 */
myjs.tedir.Custom_.prototype.parse = function(context) {
  return this.handler.parse(context);
};

/**
 * A sequence of expressions.
 *
 * @param {Array.<myjs.tedir.Expression>} terms the terms that make up this
 *   sequence.
 * @constructor
 * @extends myjs.tedir.Expression
 * @private
 */
myjs.tedir.Sequence_ = function(terms) {
  myjs.utils.base(this).call(this);
  this.terms = terms;
};
goog.inherits(myjs.tedir.Sequence_, myjs.tedir.Expression);

/**
 * @inheritDoc
 */
myjs.tedir.Sequence_.prototype.getType = function() {
  return 'SEQUENCE';
};

/**
 * @inheritDoc
 */
myjs.tedir.Sequence_.prototype.forEachChild = function(visitor) {
  this.terms.forEach(visitor);
};

/**
 * @inheritDoc
 */
myjs.tedir.Sequence_.prototype.toString = function() {
  return '(: ' + this.terms.join(' ') + ')';
};

/**
 * @inheritDoc
 */
myjs.tedir.Sequence_.prototype.parse = function(context) {
  var i, values = [];
  for (i = 0; i < this.terms.length; i++) {
    var term = this.terms[i];
    var value = term.parse(context);
    if (context.isError(value)) {
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

/**
 * @inheritDoc
 */
myjs.tedir.Sequence_.prototype.getArity = function() {
  var result = 0;
  this.terms.forEach(function(term) {
    if (term.useValue()) {
      result++;
    }
  });
  return result;
};

/**
 * @inheritDoc
 */
myjs.tedir.Sequence_.prototype.calcUseValue = function() {
  var i, result = false;
  for (i = 0; i < this.terms.length; i++) {
    if (this.terms[i].useValue()) {
      return true;
    }
  }
  return false;
};

/**
 * @inheritDoc
 */
myjs.tedir.Sequence_.prototype.normalize = function() {
  var normalTerms = [];
  this.terms.forEach(function(term) {
    var normalTerm = term.normalize();
    // Ignore the empty terminal.
    if (!normalTerm.isEmpty()) {
      normalTerms.push(normalTerm);
    }
  });
  if (normalTerms.length == 0) {
    return myjs.tedir.Empty_.INSTANCE;
  } else if (normalTerms.length == 1) {
    return normalTerms[0];
  } else {
    return new myjs.tedir.Sequence_(normalTerms);
  }
};

/**
 * An ordered choice between expressions.
 *
 * @param {Array.<myjs.tedir.Expression>} terms the terms to choose between.
 * @constructor
 * @extends myjs.tedir.Expression
 * @private
 */
myjs.tedir.Choice_ = function(terms) {
  myjs.utils.base(this).call(this);
  this.terms = terms;
};
goog.inherits(myjs.tedir.Choice_, myjs.tedir.Expression);

/**
 * @inheritDoc
 */
myjs.tedir.Choice_.prototype.getType = function() {
  return 'CHOICE';
};

/**
 * @inheritDoc
 */
myjs.tedir.Choice_.prototype.toString = function() {
  return '(| ' + this.terms.join(' ') + ')';
};

/**
 * @inheritDoc
 */
myjs.tedir.Choice_.prototype.parse = function(context) {
  var i, start = context.input.getCursor();
  for (i = 0; i < this.terms.length; i++) {
    var term = this.terms[i];
    var result = term.parse(context);
    if (context.isError(result)) {
      context.input.rewind(start);
    } else {
      return result;
    }
  }
  return context.getErrorMarker();
};

/**
 * @inheritDoc
 */
myjs.tedir.Choice_.prototype.forEachChild = function(visitor) {
  this.terms.forEach(visitor);
};

/**
 * @inheritDoc
 */
myjs.tedir.Choice_.prototype.normalize = function() {
  if (this.terms.length == 1) {
    return this.terms[0].normalize();
  } else {
    var newTerms = this.terms.map(function(t) { return t.normalize(); });
    return new myjs.tedir.Choice_(newTerms);
  }
};

/**
 * The empty expression that trivially matches everything without consuming
 * any input.
 *
 * @constructor
 * @extends myjs.tedir.Expression
 * @private
 */
myjs.tedir.Empty_ = function() {
  myjs.utils.base(this).call(this);
};
goog.inherits(myjs.tedir.Empty_, myjs.tedir.Expression);

/**
 * Singleton instance of empty.
 */
myjs.tedir.Empty_.INSTANCE = new myjs.tedir.Empty_();

/**
 * @inheritDoc
 */
myjs.tedir.Empty_.prototype.getType = function() {
  return 'EMPTY';
};

/**
 * @inheritDoc
 */
myjs.tedir.Empty_.prototype.forEachChild = function(visitor) {
  // ignore
};

/**
 * @inheritDoc
 */
myjs.tedir.Empty_.prototype.isEmpty = function() {
  return true;
};

/**
 * @inheritDoc
 */
myjs.tedir.Empty_.prototype.normalize = function() {
  return this;
};

/**
 * @inheritDoc
 */
myjs.tedir.Empty_.prototype.parse = function(context) {
  return null;
};

/**
 * @inheritDoc
 */
myjs.tedir.Empty_.prototype.calcUseValue = function() {
  return false;
};

/**
 * @inheritDoc
 */
myjs.tedir.Empty_.prototype.toString = function() {
  return '.';
};

/**
 * A marker that ensures that the value of the given subexpression will
 * not be included in the resulting concrete syntax tree.
 *
 * @param {myjs.tedir.Expression} term the subexpression to parse and
 *   then discard the value of.
 * @constructor
 * @extends myjs.tedir.Expression
 * @private
 */
myjs.tedir.Ignore_ = function(term) {
  myjs.utils.base(this).call(this);
  this.term = term;
};
goog.inherits(myjs.tedir.Ignore_, myjs.tedir.Expression);

/**
 * @inheritDoc
 */
myjs.tedir.Ignore_.prototype.getType = function() {
  return 'IGNORE';
};

/**
 * @inheritDoc
 */
myjs.tedir.Ignore_.prototype.forEachChild = function(visitor) {
  visitor(this.term);
};

/**
 * @inheritDoc
 */
myjs.tedir.Ignore_.prototype.parse = function(context) {
  var value = this.term.parse(context);
  return context.isError(value) ? value : null;
};

/**
 * @inheritDoc
 */
myjs.tedir.Ignore_.prototype.normalize = function() {
  return new myjs.tedir.Ignore_(this.term.normalize());
};

/**
 * @inheritDoc
 */
myjs.tedir.Ignore_.prototype.calcUseValue = function() {
  return false;
};

/**
 * @inheritDoc
 */
myjs.tedir.Ignore_.prototype.toString = function() {
  return '(_ ' + this.term + ')';
};

/**
 * A grammar expression that, when parsing, first parses according to the
 * given subexpression and then invokes the given filter function with the
 * result, finally returning the value returned by the filter function.
 *
 * @param {myjs.tedir.Expression} term the subexpression to parse.
 * @param {function(Array):*} filter the filter function to invoke.
 * @param {boolean} isConstructor call the function as a constructor?
 * @param {number=} opt_arity the arity of the subexpression, if known. If
 *   not specified it will be calculated when needed.
 * @constructor
 * @extends myjs.tedir.Expression
 * @private
 */
myjs.tedir.Filter_ = function(term, filter, isConstructor, opt_arity) {
  this.term = term;
  this.filter = filter;
  this.isConstructor = isConstructor;
  var arity = (opt_arity === undefined) ? -1 : opt_arity;
  this.arity = arity;
  this.invoker = myjs.tedir.Invoker_.forArity(arity, this.isConstructor,
    this.filter);
};
goog.inherits(myjs.tedir.Filter_, myjs.tedir.Expression);

/**
 * @inheritDoc
 */
myjs.tedir.Filter_.prototype.getType = function() {
  return 'FILTER';
};

/**
 * @inheritDoc
 */
myjs.tedir.Filter_.prototype.forEachChild = function(visitor) {
  visitor(this.term);
};

/**
 * @inheritDoc
 * @suppress {checkTypes}
 */
myjs.tedir.Filter_.prototype.parse = function(context) {
  var value = this.term.parse(context);
  return context.isError(value) ? value : (this.invoker)(value);
};

/**
 * @inheritDoc
 */
myjs.tedir.Filter_.prototype.normalize = function() {
  var term = this.term.normalize();
  var arity = (this.arity === -1) ? term.getArity() : this.arity;
  return new myjs.tedir.Filter_(term, this.filter, this.isConstructor,
    arity);
};

/**
 * Utility function for invoking functions with a given arity.
 *
 * @constructor
 * @private
 */
myjs.tedir.Invoker_ = function() { };

goog.exportSymbol('myjs.tedir.Invoker_', myjs.tedir.Invoker_);

/**
 * Returns a function that, when given a list of arguments, call the given
 * function in the appropriate way..
 *
 * @param {number} arity how many arguments are we going to pass?
 * @param {boolean} isConstructor call the function as a constructor?
 * @param {function(...):*} fun the function to call.
 * @return {?function(Array):*} function that calls fun appropriately.
 */
myjs.tedir.Invoker_.forArity = function(arity, isConstructor, fun) {
  if (arity == -1) {
    return null;
  } else if (isConstructor) {
    return myjs.tedir.Invoker_.constructorForArity(fun, arity);
  } else {
    return myjs.tedir.Invoker_.callerForArity(fun, arity);
  }
};

goog.exportProperty(myjs.tedir.Invoker_, 'forArity',
  myjs.tedir.Invoker_.forArity);

/**
 * Returns a function that, when called with an arguments array (that is,
 * a real array of arguments not an arguments object) calls the given
 * function in the appropriate way for passing it 'arity' arguments.
 *
 * @param {function(...):*} fun function to call.
 * @param {number} arity expected number of arguments.
 * @return {function(Array):*} function that calls the given function in the
 *   appropriate way for the given number of arguments.
 */
myjs.tedir.Invoker_.callerForArity = function(fun, arity) {
  switch (arity) {
  case 1:
    return function(args) { return fun.call(null, args); };
  default:
    return function(args) { return fun.apply(null, args); };
  }
};

/**
 * A cache of constructor bridges.
 * @type {Array.<Function>}
 */
myjs.tedir.Invoker_.constructorBridges = [];

/**
 * Returns a function that, when given an array, calls the given constructor
 * in the appropriate way for that arity.
 *
 * @param {function(this:Object,...):*} Cons a constructor function.
 * @param {number} arity expected number of arguments.
 * @return {function(Array):*} a bridge function for calling the constructor.
 * @suppress {checkTypes}
 */
myjs.tedir.Invoker_.constructorForArity = function(Cons, arity) {
  if (arity == 1) {
    return function(args) { return new Cons(args); };
  } else {
    var bridgeBuilder = myjs.tedir.Invoker_.constructorBridges[arity];
    if (!bridgeBuilder) {
      bridgeBuilder = myjs.tedir.Invoker_.buildConstructorBridge(arity);
      myjs.tedir.Invoker_.constructorBridges[arity] = bridgeBuilder;
    }
    return bridgeBuilder(Cons);
  }
};

/**
 * Constructs a function that calls a function as a constructor with a
 * specified number of arguments, taken from a list.
 *
 * @param {number} arity how many arguments should the function be called
 *   with?
 * @return {function():function(Array):*} a function that, given a
 *   constructor function, returns a function that takes an array and calls
 *   the first function as a constructor with those arguments.
 */
myjs.tedir.Invoker_.buildConstructorBridge = function(arity) {
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
 *
 * @param {myjs.tedir.Expression} body the expression to repeat.
 * @param {myjs.tedir.Expression=} opt_sep an optional expression to separate
 *   occurrences of the body. If not specified the empty expression is used.
 * @param {boolean=} opt_allowEmpty whether to allow the sequence to be empty.
 * @constructor
 * @extends myjs.tedir.Expression
 * @private
 */
myjs.tedir.Repeat_ = function(body, opt_sep, opt_allowEmpty) {
  myjs.utils.base(this).call(this);
  this.body = body;
  this.sep = opt_sep || myjs.tedir.Empty_.INSTANCE;
  this.allowEmpty = !!opt_allowEmpty;
};
goog.inherits(myjs.tedir.Repeat_, myjs.tedir.Expression);

/**
 * @inheritDoc
 */
myjs.tedir.Repeat_.prototype.getType = function() {
  return 'REPEAT';
};

/**
 * @inheritDoc
 */
myjs.tedir.Repeat_.prototype.forEachChild = function(visitor) {
  visitor(this.body);
  visitor(this.sep);
};

/**
 * @inheritDoc
 */
myjs.tedir.Repeat_.prototype.normalize = function() {
  return new myjs.tedir.Repeat_(this.body.normalize(), this.sep.normalize(),
      this.allowEmpty);
};

/**
 * @inheritDoc
 */
myjs.tedir.Repeat_.prototype.parse = function(context) {
  var input = context.input;
  var start = input.getCursor();
  var body = this.body;
  var sep = this.sep;
  var first = body.parse(context);
  if (context.isError(first)) {
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
      if (context.isError(sepValue)) {
        input.rewind(start);
        break;
      } else {
        var bodyValue = body.parse(context);
        if (context.isError(bodyValue)) {
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

/**
 * @inheritDoc
 */
myjs.tedir.Repeat_.prototype.toString = function() {
  return '(' + (this.allowEmpty ? '* ' : '+ ') + this.body + ' ' + this.sep +
    ')';
};

/**
 * Abstract supertype for grammar and syntax objects.
 */
myjs.tedir.GrammarOrSyntax = function() { };

/**
 * Abstract supertype for syntaxes.
 *
 * @constructor
 */
myjs.tedir.Syntax = function() { };
goog.inherits(myjs.tedir.Syntax, myjs.tedir.GrammarOrSyntax);
goog.exportSymbol('myjs.tedir.Syntax', myjs.tedir.Syntax);

/**
 * Creates a new literal syntax builder.
 *
 * @return {myjs.tedir.Syntax} a new syntax builder.
 */
myjs.tedir.Syntax.create = function() {
  return new myjs.tedir.LiteralSyntax_();
};

goog.exportProperty(myjs.tedir.Syntax, 'create', myjs.tedir.Syntax.create);

/**
 * Returns the rule with the given name.
 *
 * @param {string} name the name of the nonterm to return.
 * @param {boolean=} opt_failIfMissing if true is passed, throws an error if
 *   the nonterm doesn't exist. Otherwise creates it.
 * @return {myjs.tedir.Rule} the rule with the given name.
 */
myjs.tedir.Syntax.prototype.getRule = goog.abstractMethod;

goog.exportProperty(myjs.tedir.Syntax.prototype, 'getRule',
  myjs.tedir.Syntax.prototype.getRule);

/**
 * Returns a list of all the rule names defined in this syntax.
 *
 * @return {Array.<string>} a list of all rule names.
 */
myjs.tedir.Syntax.prototype.getRuleNames = goog.abstractMethod;

/**
 * Returns a syntax that contains the union of the rules defined in this
 * grammar and the ones passed in the list argument.
 *
 * @param {Array.<myjs.tedir.Syntax>} members an array of syntaxes.
 * @return {myjs.tedir.Syntax} the compositiong of this and the
 *   given syntaxes.
 */
myjs.tedir.Syntax.prototype.compose = function(members) {
  return new myjs.tedir.CompositeSyntax_([this].concat(members));
};

/**
 * Invokes the callback for each rule defined in this grammar.
 *
 * @param {function(string, myjs.tedir.Rule)} callback the function to invoke.
 */
myjs.tedir.Syntax.prototype.forEachRule = function(callback) {
  this.getRuleNames().forEach(function(name) {
    callback(name, this.getRule(name).asExpression_());
  }.bind(this));
};

/**
 * Returns a new grammar that represents this syntax.
 *
 * @return {myjs.tedir.Grammar} a grammar for this syntax.
 */
myjs.tedir.Syntax.prototype.asGrammar = function() {
  return new myjs.tedir.Grammar(this);
};

/**
 * A (potentially partial) syntax definition.
 *
 * @constructor
 * @extends myjs.tedir.Syntax
 * @private
 */
myjs.tedir.LiteralSyntax_ = function() {
  this.rules = {};
};
goog.inherits(myjs.tedir.LiteralSyntax_, myjs.tedir.Syntax);

/**
 * @inheritDoc
 */
myjs.tedir.LiteralSyntax_.prototype.toString = function() {
  var getPair = function(k) {
    return k + ': ' + this.rules[k];
  }.bind(this);
  return 'grammar { ' + this.getRuleNames().map(getPair).join(', ') + ' } ';
};

/**
 * @inheritDoc
 */
myjs.tedir.LiteralSyntax_.prototype.getRuleNames = function() {
  return Object.keys(this.rules);
};

/**
 * @inheritDoc
 */
myjs.tedir.LiteralSyntax_.prototype.getRule = function(name,
    opt_failIfMissing) {
  if (!(this.rules.hasOwnProperty(name))) {
    if (opt_failIfMissing) {
      throw new myjs.tedir.Error('Undefined nonterminal <' + name + '>');
    } else {
      this.rules[name] = new myjs.tedir.Rule([]);
    }
  }
  return this.rules[name];
};

goog.exportProperty(myjs.tedir.LiteralSyntax_.prototype, 'getRule',
  myjs.tedir.LiteralSyntax_.prototype.getRule);

/**
 * A syntax defined by composing a number of sub-syntaxes. Each rule in this
 * syntax has the union of all production of the same rules in all the
 * sub-syntaxes.
 *
 * @param {Array.<myjs.tedir.Syntax>} members the syntaxes this
 *   composite consists of.
 * @constructor
 * @extends myjs.tedir.Syntax
 * @private
 */
myjs.tedir.CompositeSyntax_ = function(members) {
  this.members = members;
  this.ruleCache = null;
};
goog.inherits(myjs.tedir.CompositeSyntax_, myjs.tedir.Syntax);

/**
 * @inheritDoc
 */
myjs.tedir.CompositeSyntax_.prototype.getRuleNames = function() {
  return Object.keys(this.getRules_());
};

/**
 * @inheritDoc
 */
myjs.tedir.CompositeSyntax_.prototype.getRule = function(name,
    opt_failIfMissing) {
  var rules = this.getRules_();
  if (rules.hasOwnProperty(name)) {
    return rules[name];
  } else {
    throw new myjs.tedir.Error('Undefined nonterminal <' + name + '>');
  }
};

goog.exportProperty(myjs.tedir.CompositeSyntax_.prototype, 'getRule',
  myjs.tedir.CompositeSyntax_.prototype.getRule);

/**
 * Returns a mapping from nonterm names to the union of all the corresponding
 * productions from the sub-syntaxes. Calculates and caches the result the
 * first time it is called.
 *
 * @return {!Object.<string, myjs.tedir.Rule>} a map from names to the resulting
 *   combined rules.
 * @private
 */
myjs.tedir.CompositeSyntax_.prototype.getRules_ = function() {
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
      this.ruleCache[name] = myjs.tedir.Rule.merge_(ruleLists[name]);
    }.bind(this));
  }
  return this.ruleCache;
};

/**
 * A single production.
 *
 * @param {myjs.tedir.Expression} value the value of this production.
 * @constructor
 * @private
 */
myjs.tedir.Production_ = function(value) {
  this.value = value;
  this.filter = null;
};

/**
 * Returns the expression value of this production.
 *
 * @return {myjs.tedir.Expression} the value of this production.
 * @private
 */
myjs.tedir.Production_.prototype.asExpression_ = function() {
  if (this.filter) {
    return myjs.tedir.factory.filter(this.value, this.filter.fun,
      this.filter.isConstructor);
  } else {
    return this.value;
  }
};

/**
 * The "value" of a nonterm, the productions the nonterm expands to. Can be
 * used to build nonterms using {@link #addProd}.
 *
 * @param {Array.<myjs.tedir.Production_>} prods the array to store
 *   productions in for this rule.
 * @constructor
 */
myjs.tedir.Rule = function(prods) {

  /**
   * The rules of this production.
   * @type {Array.<myjs.tedir.Production_>}
   * @private
   */
  this.prods_ = prods;

  /**
   * A cache for the expression value of this rule.
   * @type {?myjs.tedir.Expression}
   * @private
   */
  this.exprCache_ = null;

};

/**
 * Merges the given rules into a single rule with the union of all the
 * productions.
 *
 * @param {Array.<myjs.tedir.Rule>} rules to merge.
 * @return {myjs.tedir.Rule} a rule containing all the productions from the
 *   given list.
 * @private
 */
myjs.tedir.Rule.merge_ = function(rules) {
  if (rules.length == 1) {
    return rules[0];
  } else {
    var prods = [];
    rules.forEach(function(rule) {
      prods = prods.concat(rule.prods_);
    });
    return new myjs.tedir.Rule(prods);
  }
};

/**
 * Returns the last production that was added.
 *
 * @return {myjs.tedir.Production_} the last added production.
 * @private
 */
myjs.tedir.Rule.prototype.getLastProd_ = function() {
  return this.prods_[this.prods_.length - 1];
};

/**
 * Adds a new production to this rule.
 *
 * @param {...myjs.tedir.Expression} var_args a sequence of subexpressions.
 * @return {myjs.tedir.Rule} this rule, to enable call chaining.
 */
myjs.tedir.Rule.prototype.addProd = function(var_args) {
  var array = myjs.utils.toArray(arguments);
  this.prods_.push(new myjs.tedir.Production_(new myjs.tedir.Sequence_(array)));
  return this;
};

goog.exportProperty(myjs.tedir.Rule.prototype, 'addProd',
  myjs.tedir.Rule.prototype.addProd);

/**
 * Sets the constructor function that should be instantiated when the last
 * production that was added succeeds during parsing. Equivalent to calling
 * {@link #setHandler} with opt_isConstructor=true.
 *
 * @param {Function} Constructor the constructor function.
 * @return {myjs.tedir.Rule} this rule, to enable call chaining.
 */
myjs.tedir.Rule.prototype.setConstructor = function(Constructor) {
  return this.setHandler(Constructor, true);
};

goog.exportProperty(myjs.tedir.Rule.prototype, 'setConstructor',
  myjs.tedir.Rule.prototype.setConstructor);

/**
 * Sets the function that should be called when the last production that
 * was added succeeds during parsing.
 *
 * @param {Function} handler the function to handle the value.
 * @param {boolean=} opt_isConstructor whether the handler should be called
 *   as a function or a constructor.
 * @return {myjs.tedir.Rule} this rule, to enable call chaining.
 */
myjs.tedir.Rule.prototype.setHandler = function(handler, opt_isConstructor) {
  this.getLastProd_().filter = {
    fun: handler,
    isConstructor: !!opt_isConstructor
  };
  return this;
};

goog.exportProperty(myjs.tedir.Rule.prototype, 'setHandler',
  myjs.tedir.Rule.prototype.setHandler);

/**
 * Returns the expression produced by this rule.
 *
 * @return {myjs.tedir.Expression} the expression produced by this rule.
 * @private
 */
myjs.tedir.Rule.prototype.asExpression_ = function() {
  if (!this.exprCache_) {
    var prodExprs = this.prods_.map(function(p) { return p.asExpression_(); });
    this.exprCache_ = new myjs.tedir.Choice_(prodExprs);
  }
  return this.exprCache_;
};

/**
 * A fixed immutable grammar. Where syntaxes are (or at least can be)
 * fragments that have to be joined together to be complete, a grammar
 * is always complete.
 *
 * @param {myjs.tedir.Syntax} syntax the syntax to base this grammar
 *   on.
 * @constructor
 */
myjs.tedir.Grammar = function(syntax) {
  this.syntax = syntax;
  this.nonterms = {};
};

/**
 * Returns true if this grammar is valid. A grammar is valid if all referenced
 * nonterms exist.
 *
 * @return {boolean} true iff this grammar is valid.
 * @private
 */
myjs.tedir.Grammar.prototype.isValid_ = function() {
  return true;
};

/**
 * Convenience method that allows syntaxes and grammars to be treated
 * uniformly.
 *
 * @return {myjs.tedir.Grammar} this grammar.
 */
myjs.tedir.Grammar.prototype.asGrammar = function() {
  return this;
};

/**
 * Returns the local nonterminal with the given name, building it the
 * first time the method is called.
 *
 * @param {string} name the name of the nonterm to return.
 * @return {myjs.tedir.Expression} the value of that nonterm.
 */
myjs.tedir.Grammar.prototype.getNonterm = function(name) {
  var value = this.nonterms[name];
  if (!value) {
    value = this.buildNonterm_(name);
    this.nonterms[name] = value;
  }
  return value;
};

/**
 * Returns a normalized local expression for the given nonterm that only
 * this grammar will use.
 *
 * @param {string} name the name of the nonterm.
 * @return {myjs.tedir.Expression} the value of that nonterm.
 * @private
 */
myjs.tedir.Grammar.prototype.buildNonterm_ = function(name) {
  var rule = this.syntax.getRule(name, true);
  return rule.asExpression_().normalize();
};

/**
 * Interface for token objects.
 *
 * @interface
 */
myjs.tedir.Token = function() { };

/**
 * Is this a soft token?
 *
 * @return {boolean} true iff this is a soft token.
 */
myjs.tedir.Token.prototype.isSoft = function() {};

goog.exportProperty(myjs.tedir.Token.prototype, 'isSoft',
  myjs.tedir.Token.prototype.isSoft);

/**
 * End of file token.
 *
 * @constructor
 * @implements myjs.tedir.Token
 * @private
 */
myjs.tedir.EofToken_ = function() {
  this.value = 'eof';
  this.type = 'eof';
};

/**
 * @inheritDoc
 */
myjs.tedir.EofToken_.prototype.isSoft = function() {
  return false;
};

/**
 * @private
 */
myjs.tedir.EOF_TOKEN_ = new myjs.tedir.EofToken_();

/**
 * A stream of tokens with information together with a cursor that indicates
 * the current token.
 *
 * @param {Array.<myjs.tedir.Token>} tokens an array of tokens.
 * @constructor
 */
myjs.tedir.TokenStream = function(tokens) {
  this.tokens = tokens;
  this.cursor = 0;
  this.highWaterMark = 0;
  this.skipEther();
};

/**
 * Returns the current token.
 *
 * @return {myjs.tedir.Token} the current token.
 */
myjs.tedir.TokenStream.prototype.getCurrent = function() {
  if (this.hasMore()) {
    return this.tokens[this.cursor];
  } else {
    return myjs.tedir.EOF_TOKEN_;
  }
};

/**
 * Does this stream have more tokens?
 *
 * @return {boolean} true if there are more tokens in this stream.
 */
myjs.tedir.TokenStream.prototype.hasMore = function() {
  return this.cursor < this.tokens.length;
};

/**
 * Advances the cursor until it reaches a non-soft token or the end of the
 * token stream.
 *
 * @see myjs.tedir.Token#isSoft
 */
myjs.tedir.TokenStream.prototype.skipEther = function() {
  while (this.hasMore() && this.getCurrent().isSoft()) {
    this.cursor++;
  }
  if (this.cursor > this.highWaterMark) {
    this.highWaterMark = this.cursor;
  }
};

/**
 * Advances the cursor one step and then skips over any soft tokens.
 */
myjs.tedir.TokenStream.prototype.advance = function() {
  this.cursor++;
  this.skipEther();
};

/**
 * Returns the current cursor.
 *
 * @return {number} the index of the current token.
 */
myjs.tedir.TokenStream.prototype.getCursor = function() {
  return this.cursor;
};

/**
 * Rewinds the cursor to the given position earlier in the stream.
 *
 * @param {number} value the position to rewind to.
 */
myjs.tedir.TokenStream.prototype.rewind = function(value) {
  this.cursor = value;
};

/**
 * A collection of information about a parse process.
 *
 * @param {myjs.tedir.Parser} parser the parser using this context.
 * @param {myjs.tedir.TokenStream} input the input we're parsing.
 * @constructor
 */
myjs.tedir.ParseContext = function(parser, input) {
  this.parser = parser;
  this.input = input;
};

/**
 * Returns the raw token stream of input.
 *
 * @return {myjs.tedir.TokenStream} the raw array of input tokens.
 */
myjs.tedir.ParseContext.prototype.getTokenStream = function() {
  return this.input;
};

/**
 * Returns the sentinel object used to signal that parsing failed.
 *
 * @return {Object} the one singleton object that
 *   {@link #isError} will return true for.
 */
myjs.tedir.ParseContext.prototype.getErrorMarker = function() {
  return myjs.tedir.ERROR_MARKER_;
};

/**
 * Is the given value the singleton error marker value?
 *
 * @param {*} value the value to test.
 * @return {boolean} true iff the value is the error marker object.
 * @see #getErrorMarker
 */
myjs.tedir.ParseContext.prototype.isError = function(value) {
  return value == myjs.tedir.ERROR_MARKER_;
};

/**
 * Information about where a given piece of source code comes from.
 *
 * @param {string=} opt_fileName The name of the source file.
 * @constructor
 */
myjs.tedir.SourceOrigin = function(opt_fileName) {
  this.fileName = opt_fileName || null;
};

goog.exportSymbol('myjs.tedir.SourceOrigin', myjs.tedir.SourceOrigin);

/**
 * Returns the name of the file this source came from or null if it is
 * unknown.
 *
 * @return {?string} the file name if it is known.
 */
myjs.tedir.SourceOrigin.prototype.getFileName = function() {
  return this.fileName;
};

/**
 * Creates a new parser that can be used to parse a given sequence of
 * tokens.
 *
 * @param {myjs.tedir.Syntax|myjs.tedir.Grammar} grammarOrSyntax
 *   the grammar or syntax to parse according to.
 * @constructor
 */
myjs.tedir.Parser = function(grammarOrSyntax) {
  this.grammar = grammarOrSyntax.asGrammar();
};
goog.exportSymbol('myjs.tedir.Parser', myjs.tedir.Parser);

/**
 * Parses the given array of tokens according to this parser's grammar.
 *
 * @param {string} nonterm the start production.
 * @param {Array} tokens the array of tokens to parse.
 * @param {myjs.tedir.SourceOrigin=} opt_origin the origin of the source.
 * @return {*} a syntax tree constructed according to the grammar.
 * @throws {myjs.tedir.SyntaxError} if the tokens can't be parsed.
 */
myjs.tedir.Parser.prototype.parse = function(nonterm, tokens, opt_origin) {
  var origin = opt_origin || new myjs.tedir.SourceOrigin();
  var start = this.grammar.getNonterm(nonterm);
  var stream = new myjs.tedir.TokenStream(tokens);
  var context = new myjs.tedir.ParseContext(this, stream);
  var result = start.parse(context);
  var error = (context.isError(result) || stream.hasMore()) ?
      new myjs.tedir.SyntaxError(origin, stream, stream.highWaterMark) : null;
  if (context.isError(result) || stream.hasMore()) {
    throw error;
  } else {
    return result;
  }
};

goog.exportProperty(myjs.tedir.Parser.prototype, 'parse',
  myjs.tedir.Parser.prototype.parse);
