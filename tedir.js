"use strict";

// Declare namespace
var tedir = tedir || (function defineTedir(namespace) { // offset: 3

  /**
   * Namespace for stuff that isn't really part of the public API but which
   * it is convenient to be able to access from tests etc.
   */
  namespace.internal = {};

  /**
   * Signals an error condition in tedir.
   */
  namespace.Error = TedirError;
  function TedirError(message) {
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TedirError);
    }
    this.message = message;
  }

  TedirError.prototype.toString = function () {
    return "tedir.Error: " + this.message;
  };

  /**
   * Signals an error while parsing.
   */
  namespace.SyntaxError = TedirSyntaxError;
  function TedirSyntaxError(input, tokenIndex) {
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SyntaxError);
    }
    this.input = input;
    this.tokenIndex = tokenIndex;
  }

  TedirSyntaxError.prototype.getOffendingToken = function () {
    return this.input.tokens[this.tokenIndex].value;
  };

  TedirSyntaxError.prototype.toString = function () {
    return "tedir.SyntaxError: Unexpected token " + this.getOffendingToken();
  };

  namespace.internal.toArray = toArray;
  /**
   * Converts any array-like object (including arguments objects) to a proper
   * array.
   */
  function toArray(args) {
    return Array.prototype.slice.call(args);
  }

  namespace.inherits = inherits;
  /**
   * Simple prototype-based inheritance.
   */
  function inherits(sub, sup) {
    function Inheriter() { }
    Inheriter.prototype = sup.prototype;
    sub.prototype = new Inheriter();
    sub.parent = sup;
  }

  /**
   * Singleton factory object. In general, avoid making any assumptions about
   * what 'this' is when the factory methods are called since it may be
   * convenient to call those methods other than directly through a reference
   * to 'factory'.
   */
  var factory = {};
  namespace.factory = factory;

  factory.value = function (value) {
    return new Token(value, false);
  };

  factory.token = function (value) {
    return factory.ignore(new Token(value, false));
  };

  factory.keyword = function (value) {
    return factory.ignore(new Token(value, true));
  };

  factory.nonterm = function (name) {
    return new Nonterm(name);
  };

  factory.seq = function () {
    return new Sequence(toArray(arguments));
  };

  factory.choice = function () {
    return new Choice(toArray(arguments));
  };

  factory.option = function () {
    return factory.choice(new Sequence(toArray(arguments)), EMPTY);
  };

  factory.star = function (value, sepOpt) {
    return new Repeat(value, sepOpt, true);
  };

  factory.plus = function (value, sepOpt) {
    return new Repeat(value, sepOpt, false);
  };

  factory.empty = function () {
    return EMPTY;
  };

  factory.ignore = function (value) {
    return new Ignore(value);
  };

  factory.filter = function (body, filter, isConstructor) {
    return new Filter(body, filter, isConstructor);
  };

  var ERROR_MARKER = {};

  function isError(value) {
    return value === ERROR_MARKER;
  }

  /**
   * The abstract supertype for syntax expressions.
   */
  function Expression() {
    this.useValueCache = null;
  }

  Expression.prototype.accept = function (visitor) {
    return visitor(this, this.getType());
  };

  /**
   * If the value of this expression is passed through a filter, how many
   * filter arguments does it correspond to?
   */
  Expression.prototype.getArity = function () {
    return 1;
  };

  /**
   * Should the value of this expression be ignored in the result?  Caches
   * its result so calls are O(1).
   */
  Expression.prototype.useValue = function () {
    if (this.useValueCache === null) {
      this.useValueCache = this.calcUseValue();
    }
    return this.useValueCache;
  };

  /**
   * Calculates whether the value of this expression should be ignored.
   * Generally, don't call this directly, use useValue so you get caching.
   */
  Expression.prototype.calcUseValue = function () {
    return true;
  };

  /**
   * Is this the empty expression?  Note that non-normalized expressions may
   * return false but effectively be the empty expression.
   */
  Expression.prototype.isEmpty = function () {
    return false;
  };

  /**
   * An atomic terminal symbol.
   */
  inherits(Token, Expression);
  function Token(value, isKeyword) {
    Token.parent.call(this);

    // What kind of input tokens does this grammar token match?
    this.value = value;

    // Is this a keyword or a non-keyword delimiter?
    this.isKeyword = isKeyword;
  }

  Token.prototype.getType = function () {
    return "TOKEN";
  };

  Token.prototype.forEachChild = function (visitor) {
    // ignore
  };

  Token.prototype.normalize = function () {
    return new Token(this.value, this.isKeyword);
  };

  Token.prototype.parse = function (parser, stream) {
    var current = stream.getCurrent();
    if (stream.getCurrent().type == this.value) {
      stream.advance();
      return current.value;
    } else {
      return ERROR_MARKER;
    }
  };

  Token.prototype.toString = function () {
    return "\"" + this.value + "\"";
  };

  /**
   * A nonterminal reference.
   */
  inherits(Nonterm, Expression);
  function Nonterm(name) {
    Nonterm.parent.call(this);
    this.name = name;
  }

  Nonterm.prototype.getType = function () {
    return "NONTERM";
  };

  Nonterm.prototype.forEachChild = function (visitor) {
    // ignore
  };

  Nonterm.prototype.normalize = function () {
    return new Nonterm(this.name);
  };

  Nonterm.prototype.parse = function (parser, stream) {
    return parser.grammar.getNonterm(this.name).parse(parser, stream);
  };

  Nonterm.prototype.toString = function () {
    return "<" + this.name + ">";
  };

  /**
   * A sequence of expressions.
   */
  inherits(Sequence, Expression);
  function Sequence(terms) {
    Sequence.parent.call(this);
    this.terms = terms;
  }

  Sequence.prototype.getType = function () {
    return "SEQENCE";
  };

  Sequence.prototype.forEachChild = function (visitor) {
    this.terms.forEach(visitor);
  };

  Sequence.prototype.toString = function () {
    return "(: " + this.terms.join(" ") + ")";
  };

  Sequence.prototype.parse = function (parser, stream) {
    var i, values = [];
    for (i = 0; i < this.terms.length; i++) {
      var term = this.terms[i];
      var value = term.parse(parser, stream);
      if (isError(value)) {
        return ERROR_MARKER;
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

  Sequence.prototype.getArity = function () {
    var result = 0;
    this.terms.forEach(function (term) {
      if (term.useValue()) {
        result++;
      }
    });
    return result;
  };

  Sequence.prototype.calcUseValue = function () {
    var i, result = false;
    for (i = 0; i < this.terms.length; i++) {
      if (this.terms[i].useValue()) {
        return true;
      }
    }
    return false;
  };

  Sequence.prototype.normalize = function () {
    var normalTerms = [];
    this.terms.forEach(function (term) {
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
      return new Sequence(normalTerms);
    }
  };

  /**
   * An unordered choice between expressions.
   */
  inherits(Choice, Expression);
  function Choice(terms) {
    Choice.parent.call(this);
    this.terms = terms;
  }

  Choice.prototype.getType = function () {
    return "CHOICE";
  };

  Choice.prototype.addOption = function (term) {
    this.terms.push(term);
  };

  Choice.prototype.toString = function () {
    return "(| " + this.terms.join(" ") + ")";
  };

  Choice.prototype.parse = function (parser, stream) {
    var i, start = stream.getCursor();
    for (i = 0; i < this.terms.length; i++) {
      var term = this.terms[i];
      var result = term.parse(parser, stream);
      if (isError(result)) {
        stream.rewind(start);
      } else {
        return result;
      }
    }
    return ERROR_MARKER;
  };

  Choice.prototype.forEachChild = function (visitor) {
    this.terms.forEach(visitor);
  };

  function normalizeAll(terms) {
    return terms.map(function (t) { return t.normalize(); });
  }

  Choice.prototype.normalize = function () {
    if (this.terms.length == 1) {
      return this.terms[0].normalize();
    } else {
      return new Choice(normalizeAll(this.terms));
    }
  };

  /**
   * The empty expression that trivially matches everything.
   */
  inherits(Empty, Expression);
  function Empty() {
    Empty.parent.call(this);
  }

  var EMPTY = new Empty();

  Empty.prototype.getType = function () {
    return "EMPTY";
  };

  Empty.prototype.forEachChild = function (visitor) {
    // ignore
  };

  Empty.prototype.isEmpty = function () {
    return true;
  };

  Empty.prototype.normalize = function () {
    return this;
  };

  Empty.prototype.parse = function (parser, stream) {
    return null;
  };

  Empty.prototype.calcUseValue = function () {
    return false;
  };

  Empty.prototype.toString = function () {
    return ".";
  };

  /**
   * A marker that ensures that the value of the given subexpression will
   * not be included in the resulting concrete syntax tree.
   */
  inherits(Ignore, Expression);
  function Ignore(term) {
    Ignore.parent.call(this);
    this.term = term;
  }

  Ignore.prototype.getType = function () {
    return "IGNORE";
  };

  Ignore.prototype.forEachChild = function (visitor) {
    visitor(this.term);
  };

  Ignore.prototype.parse = function (parser, stream) {
    var value = this.term.parse(parser, stream);
    return isError(value) ? value : null;
  };

  Ignore.prototype.normalize = function () {
    return new Ignore(this.term.normalize());
  };

  Ignore.prototype.calcUseValue = function () {
    return false;
  };

  Ignore.prototype.toString = function () {
    return "(_ " + this.term + ")";
  };

  inherits(Filter, Expression);
  function Filter(term, filter, isConstructor, arityOpt) {
    this.term = term;
    this.filter = filter;
    this.isConstructor = isConstructor;
    var arity = (arityOpt === undefined) ? -1 : arityOpt;
    this.arity = arity;
    this.invoker = Invoker.forArity(arity, this.isConstructor, this.filter);
  }

  Filter.prototype.getType = function () {
    return "FILTER";
  };

  Filter.prototype.forEachChild = function (visitor) {
    visitor(this.term);
  };

  Filter.prototype.parse = function (parser, stream) {
    var value = this.term.parse(parser, stream);
    return isError(value) ? value : (this.invoker)(value);
  };

  Filter.prototype.normalize = function () {
    var term = this.term.normalize();
    var arity = (this.arity === -1) ? term.getArity() : this.arity;
    return new Filter(this.term.normalize(), this.filter, this.isConstructor, arity);
  };

  namespace.internal.Invoker = Invoker;
  /**
   * Utility function for invoking functions with a given arity.
   */
  function Invoker() { }

  Invoker.forArity = function (arity, isConstructor, fun) {
    if (arity == -1) {
      return null;
    } else if (isConstructor) {
      return Invoker.constructorForArity(fun, arity);
    } else {
      return Invoker.callerForArity(fun, arity);
    }
  };

  /**
   * Returns a function that, when called with an arguments array (that is,
   * a real array of arguments not an arguments object) calls the given
   * function in the appropriate way for passing it 'arity' arguments.
   */
  Invoker.callerForArity = function (fun, arity) {
    switch (arity) {
    case 1:
      return function (args) { return fun(args); };
    default:
      return function (args) { return fun.apply(null, args); };
    }
  };

  Invoker.constructorBridges = [];
  Invoker.constructorForArity = function (Cons, arity) {
    if (arity == 1) {
      return function (args) { return new Cons(args); };
    } else {
      var bridgeBuilder = Invoker.constructorBridges[arity];
      if (!bridgeBuilder) {
        bridgeBuilder = Invoker.buildConstructorBridge(arity);
        Invoker.constructorBridges[arity] = bridgeBuilder;
      }
      return bridgeBuilder(Cons);
    }
  };

  /**
   * Constructs a function that calls a function with a specified number
   * of arguments, taken from a list.
   */
  Invoker.buildConstructorBridge = function (arity) {
    var i, params = [];
    for (i = 0; i < arity; i++) {
      params.push("args[" + i + "]");
    }
    var source = "return new Cons(" + params.join(", ") + ");";
    var FunctionConstructor = Function;
    // Apparently jslint doesn't support suppressing individual warnings to
    // we have to trick it instead.
    var bridge = new FunctionConstructor("Cons", "args", source);
    return function (Cons) {
      return function (args) {
        return bridge(Cons, args);
      };
    };
  };

  /**
   * A repetition of an expression, separated by a separator expression.
   */
  inherits(Repeat, Expression);
  function Repeat(body, sepOpt, allowEmpty) {
    Repeat.parent.call(this);
    this.body = body;
    this.sep = sepOpt || EMPTY;
    this.allowEmpty = allowEmpty;
  }

  Repeat.prototype.getType = function () {
    return "REPEAT";
  };

  Repeat.prototype.forEachChild = function (visitor) {
    visitor(this.body);
    visitor(this.sep);
  };

  Repeat.prototype.normalize = function () {
    return new Repeat(this.body.normalize(), this.sep.normalize(),
        this.allowEmpty);
  };

  Repeat.prototype.parse = function (parser, stream) {
    var start = stream.getCursor();
    var body = this.body;
    var sep = this.sep;
    var first = body.parse(parser, stream);
    if (isError(first)) {
      if (this.allowEmpty) {
        stream.rewind(start);
        return [];
      } else {
        return ERROR_MARKER;
      }
    } else {
      var results = [];
      if (body.useValue()) {
        results.push(first);
      }
      while (true) {
        start = stream.getCursor();
        var sepValue = sep.parse(parser, stream);
        if (isError(sepValue)) {
          stream.rewind(start);
          break;
        } else {
          var bodyValue = body.parse(parser, stream);
          if (isError(bodyValue)) {
            stream.rewind(start);
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

  Repeat.prototype.toString = function () {
    return "(" + (this.allowEmpty ? "* " : "+ ") + this.body + " " + this.sep + ")";
  };

  function Operator(value) {
    this.value = value;
    this.infixPrecedence = -1;
    this.prefixPrecedence = -1;
    this.suffixPrecedence = -1;
  }

  function OperatorTable() {
    this.ops = {};
  }

  function Operators(body, table) {
    this.body = body;
    this.table = table;
  }

  /**
   * Abstract supertype for grammar and syntax objects.
   */
  function GrammarOrSyntax() { }

  /**
   * Abstract supertype for syntaxes.
   */
  inherits(AbstractSyntax, GrammarOrSyntax);
  function AbstractSyntax() { }

  /**
   * Returns a syntax that contains the same rules as this syntax
   * and the one passed as the argument.
   */
  AbstractSyntax.prototype.compose = function (other) {
    return new CompositeSyntax([this, other]);
  };

  /**
   * Invokes the callback for each rule defined in this grammar.
   */
  AbstractSyntax.prototype.forEachRule = function (callback) {
    this.getRuleNames().forEach(function (name) {
      callback(name, this.getRule(name).asExpression());
    }.bind(this));
  };

  /**
   * A (potentially partial) syntax definition. A number of syntaxes together
   * can be compiled into a grammar.
   */
  namespace.Syntax = LiteralSyntax;
  inherits(LiteralSyntax, AbstractSyntax);
  function LiteralSyntax() {
    this.rules = {};
  }

  LiteralSyntax.prototype.toString = function () {
    var getPair = function (k) {
      return k + ": " + this.rules[k];
    }.bind(this);
    return "grammar { " + this.getRuleNames().map(getPair).join(", ") + " } ";
  };

  LiteralSyntax.prototype.getRuleNames = function () {
    return Object.keys(this.rules);
  };

  /**
   * A single production.
   */
  function Production(value) {
    this.value = value;
    this.filter = null;
  }

  Production.prototype.asExpression = function () {
    if (this.filter) {
      return factory.filter(this.value, this.filter.fun, this.filter.isConstructor);
    } else {
      return this.value;
    }
  };

  /**
   * The "value" of a nonterm, the productions the nonterm expands to.
   */
  function Rule(target) {
    this.prods = [];
    this.expr = null;
  }

  /**
   * Returns the last production that was added.
   */
  Rule.prototype.getLastProd = function () {
    return this.prods[this.prods.length - 1];
  };

  /**
   * Adds a new production to this rule.
   */
  Rule.prototype.addProd = function () {
    this.prods.push(new Production(new Sequence(toArray(arguments))));
    return this;
  };

  /**
   * Sets the constructor function that should be instantiated when the last
   * production that was added succeeds during parsing.
   */
  Rule.prototype.setConstructor = function (Constructor) {
    return this.setHandler(Constructor, true);
  };

  /**
   * Sets the function that should be called when the last production that
   * was added succeeds during parsing.
   */
  Rule.prototype.setHandler = function (handler, isConstructor) {
    this.getLastProd().filter = {fun: handler, isConstructor: isConstructor};
    return this;
  };

  Rule.prototype.asExpression = function () {
    if (!this.expr) {
      this.expr = new Choice(this.prods.map(function (p) { return p.asExpression(); }));
    }
    return this.expr;
  };

  /**
   * Adds the given expression as a possible production for the given name.
   */
  LiteralSyntax.prototype.getRule = function (name, failIfMissingOpt) {
    if (!(this.rules.hasOwnProperty(name))) {
      if (failIfMissingOpt) {
        throw new TedirError("Undefined nonterminal <" + name + ">");
      } else {
        this.rules[name] = new Rule();
      }
    }
    return this.rules[name];
  };

  /**
   * Returns a new grammar that represents this syntax.
   */
  LiteralSyntax.prototype.asGrammar = function () {
    return new Grammar(this);
  };

  /**
   * A fixed immutable grammar. Where syntaxes are (or at least can be)
   * fragments that have to be joined together to be complete, a grammar
   * is always complete.
   */
  function Grammar(syntax) {
    this.syntax = syntax;
    this.nonterms = {};
  }

  /**
   * Returns true if this grammar is valid.
   */
  Grammar.prototype.isValid = function () {
    return true;
  };

  /**
   * Convenience method that allows syntaxes and grammars to be treated
   * uniformly.
   */
  Grammar.prototype.asGrammar = function () {
    return this;
  };

  /**
   * Returns the local nonterminal with the given name, building it the
   * first time the method is called.
   */
  Grammar.prototype.getNonterm = function (name) {
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
  Grammar.prototype.buildNonterm = function (name) {
    var rule = this.syntax.getRule(name, true);
    return rule.asExpression().normalize();
  };

  var END_TOKEN = new Token("eof");

  function TokenStream(tokens) {
    this.tokens = tokens;
    this.cursor = 0;
    this.highWaterMark = 0;
    this.skipEther();
  }

  TokenStream.prototype.getCurrent = function () {
    return this.hasMore() ? this.tokens[this.cursor] : END_TOKEN;
  };

  TokenStream.prototype.hasMore = function () {
    return this.cursor < this.tokens.length;
  };

  TokenStream.prototype.skipEther = function () {
    while (this.hasMore() && this.getCurrent().isSoft()) {
      this.cursor++;
    }
    if (this.cursor > this.highWaterMark) {
      this.highWaterMark = this.cursor;
    }
  };

  TokenStream.prototype.advance = function () {
    this.cursor++;
    this.skipEther();
  };

  TokenStream.prototype.getCursor = function () {
    return this.cursor;
  };

  TokenStream.prototype.rewind = function (value) {
    this.cursor = value;
  };

  /**
   * Creates a new parser that can be used to parse the given sequence of
   * tokens.
   */
  namespace.Parser = Parser;
  function Parser(grammarOrSyntax) {
    this.grammar = grammarOrSyntax.asGrammar();
  }

  Parser.prototype.parse = function (nonterm, tokens) {
    var start = this.grammar.getNonterm(nonterm);
    var stream = new TokenStream(tokens);
    var result = start.parse(this, stream);
    if (isError(result) || stream.hasMore()) {
      var error = new TedirSyntaxError(stream, stream.highWaterMark);
      throw error;
    } else {
      return result;
    }
  };

  namespace.getSource = function () {
    return String(defineTedir);
  };

  return namespace;
})({});
