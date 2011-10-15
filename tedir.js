"use strict";

// Declare namespace
var tedir = tedir || (function (namespace) {

  /**
   * Signals an error condition in tedir.
   */
  function TedirException(message) {
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, check);
    }
    this.message = message;
  }
  
  TedirException.prototype.toString = function () {
    return "TedirException: " + this.message;
  };

  function check(value, message) {
    if (!value) {
      throw new TedirException(message);
    }
  }

  /**
   * Converts any array-like object (including arguments objects) to a proper
   * array.
   */
  function toArray(args) {
    return Array.prototype.slice.call(args);
  }

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
   * Singleton factory object.
   */
  var factory = {};
  namespace.factory = factory;
  
  factory.value = function (value) {
    return new Token(value);
  };
  
  factory.token = function (value) {
    return this.ignore(this.value(value));
  }
  
  factory.nonterm = function (name) {
    return new Nonterm(name);
  };
  
  factory.seq = function () {
    return new Sequence(toArray(arguments));
  };
  
  factory.choice = function () {
    return new Choice(toArray(arguments));
  };
  
  factory.star = function (value, sepOpt) {
    return new Repeat(value, sepOpt, true)
  };

  factory.plus = function (value, sepOpt) {
    return new Repeat(value, sepOpt, false)
  };
  
  factory.empty = function () {
    return EMPTY;
  };
  
  factory.ignore = function (value) {
    return new Ignore(value);
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

  /**
   * Should the value of this expression be ignored in the result?  Caches
   * its result so calls are O(1).
   */
  Expression.prototype.useValue = function () {
    if (this.useValueCache === null)
    this.useValueCache = this.calcUseValue();
    return this.useValueCache;
  };

  /**
   * Calculates whether the value of this expression should be ignored.
   */
  Expression.prototype.calcUseValue = function () {
    return true;
  };
  
  /**
   * Is this the empty expression?  Note that non-normalized expression may
   * return false but effectively be the empty expression.
   */
  Expression.prototype.isEmpty = function () {
    return false;
  };
  
  /**
   * An atomic terminal symbol.
   */
  inherits(Token, Expression);
  function Token(value) {
    Token.parent.call(this);
    this.value = value;
  }
  
  Token.prototype.normalize = function () {
    return new Token(this.value);
  };
  
  Token.prototype.parse = function (parser, stream) {
    var current = stream.getCurrent();
    if (stream.getCurrent() == this.value) {
      stream.advance();
      return current;
    } else {
      return ERROR_MARKER;
    }
  }
  
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

  Sequence.prototype.toString = function () {
    return "(: " + this.terms.join(" ") + ")";
  };

  Sequence.prototype.parse = function (parser, stream) {
    var result = [];
    for (var i = 0; i < this.terms.length; i++) {
      var term = this.terms[i];
      var value = term.parse(parser, stream);
      if (isError(value)) {
        return ERROR_MARKER;
      } else if (term.useValue()) {
        result.push(value);
      }
    }
    return result.length == 1 ? result[0] : result;
  };
  
  Sequence.prototype.normalize = function () {
    var normalTerms = [];
    this.terms.forEach(function (term) {
      var normalTerm = term.normalize();
      // Ignore the empty terminal.
      if (!normalTerm.isEmpty()) {
        normalTerms.push(normalTerm);
      }
    })
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

  Choice.prototype.addOption = function (term) {
    this.terms.push(term);
  };

  Choice.prototype.toString = function () {
    return "(| " + this.terms.join(" ") + ")";
  };

  Choice.prototype.parse = function (parser, stream) {
    var start = stream.getCursor();
    for (var i = 0; i < this.terms.length; i++) {
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
  
  function normalizeAll(terms) {
    return terms.map(function (t) { return t.normalize(); });
  }
  
  Choice.prototype.normalize = function () {
    if (this.terms.length == 1) {
      return this.terms[0].normalize();
    } else {
      return new Choice(normalizeAll(this.terms));
    }
  }

  /**
   * The empty expression that trivially matches everything.
   */
  inherits(Empty, Expression); 
  function Empty() {
    Empty.parent.call(this);
  }
  var EMPTY = new Empty();
  
  Empty.prototype.isEmpty = function () {
    return true;
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

  Ignore.prototype.parse = function (parser, stream) {
    return this.term.parse(parser, stream);
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
  
  Repeat.prototype.normalize = function () {
    return new Repeat(this.body.normalize(), this.sep.normalize(),
        this.allowEmpty);
  }

  Repeat.prototype.parse = function (parser, stream) {
    var start = stream.getCursor();
    var body = this.body;
    var sep = this.sep;
    var first = body.parse(parser, stream);
    if (isError(first)) {
      if (this.allowEmpty) {
        stream.rewind(start);
        return null;
      } else {
        return ERROR_MARKER;
      }
    } else {
      var results = [];
      if (body.useValue())
        results.push(first);
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
            if (sep.useValue())
              results.push(sepValue);
            if (body.useValue())
              results.push(bodyValue);
            continue;
          }
        }
      }
      return results;
    }
  };

  Repeat.prototype.toString = function () {
    return "(" + (this.allowEmpty ? "* " : "+ ") + this.body + " " + this.sep + ")"
  };

  /**
   * Abstract supertype for syntaxes.
   */
  function AbstractSyntax() { }

  /**
   * Returns a syntax that contains the same rules as this syntax
   * and the one passed as the argument.
   */
  AbstractSyntax.prototype.compose = function (other) {
    return new CompositeSyntax([this, other]);
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
  
  /**
   * Adds the given expression as a possible production for the given name.
   */  
  LiteralSyntax.prototype.addRule = function (name, value) {
    if (!(name in this.rules))
      this.rules[name] = new Choice([]);
    this.rules[name].addOption(value);
  };
  
  /**
   * Returns a new grammar that represents this syntax.
   */
  LiteralSyntax.prototype.asGrammar = function () {
    return new Grammar(this);
  };
  
  LiteralSyntax.prototype.getNonterm = function (name) {
    check(name in this.rules, "Undefined nonterminal");
    return this.rules[name];
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
    return this.syntax.getNonterm(name).normalize();
  };
  
  function TokenStream(tokens) {
    this.tokens = tokens;
    this.cursor = 0;
    this.highWaterMark = 0;
  }
  
  TokenStream.prototype.getCurrent = function () {
    return this.tokens[this.cursor];
  };
  
  TokenStream.prototype.advance = function () {
    this.cursor++;
    if (this.cursor > this.highWaterMark)
      this.highWaterMark = this.cursor;
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
    if (isError(result)) {
      throw stream.tokens[stream.highWaterMark];
    } else {
      return result;
    }
  };

  return namespace;
})({});
