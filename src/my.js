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

"use strict";

(function () {

function defineMyJs(namespace, env) { // offset: 13

  var tedir = env.tedir;
  var utils = env.utils;
  var ast = env.ast;

  var inherits = utils.inherits;

  namespace.internal = {};

  /**
   * Reexports from tedir.
   */
  namespace.Syntax = tedir.Syntax;
  namespace.SourceOrigin = tedir.SourceOrigin;

  var factory = {};
  namespace.factory = factory;
  Object.keys(tedir.factory).forEach(function (key) {
    factory[key] = tedir.factory[key];
  });

  factory.punct = function (name) {
    return factory.ignore(tedir.factory.token(name, PUNCTUATOR_MARKER));
  };

  factory.punctValue = function (name) {
    return tedir.factory.token(name, PUNCTUATOR_MARKER);
  };

  factory.token = function (name) {
    return factory.ignore(tedir.factory.token(name, null));
  };

  factory.keyword = function (name) {
    return factory.ignore(tedir.factory.token(name, KEYWORD_MARKER));
  };

  factory.keywordValue = function (name) {
    return tedir.factory.token(name, KEYWORD_MARKER);
  };

  factory.value = function (name) {
    return tedir.factory.token(name, null);
  };

  var KEYWORD_MARKER = "keyword";
  var PUNCTUATOR_MARKER = "punctuator";

  /**
   * Signals an error condition in tedir.
   */
  namespace.Error = MyJsError;
  function MyJsError(message) {
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MyJsError);
    }
    this.message = message;
  }

  MyJsError.prototype.toString = function () {
    return "myjs.Error: " + this.message;
  };

  /**
   * A map from dialect name to dialect object.
   */
  var dialectRegistry = {};

  namespace.Dialect = Dialect;
  /**
   * A description of a javascript dialect.
   */
  function Dialect(name) {
    this.name = name;
    this.baseSyntaxProvider = getStandardSyntax;
    this.extensionSyntaxProviders = [];
    this.syntax = null;
    this.grammar = null;
    this.start = "Program";
    this.keywords = null;
    this.punctuators = null;
    this.settings = null;
  }

  /**
   * Returns the name that identifies this dialect.
   */
  Dialect.prototype.getName = function () {
    return this.name;
  };

  /**
   * Sets a function that, when called, returns the syntax for this dialect.
   * The reason for not setting the syntax directly is that constructing a
   * syntax for every dialect object up front is unnecessarily expensive.
   */
  Dialect.prototype.setBaseSyntaxProvider = function (value) {
    this.baseSyntaxProvider = value;
    return this;
  };

  Dialect.prototype.addExtensionSyntaxProvider = function (value) {
    this.extensionSyntaxProviders.push(value);
    return this;
  };

  /**
   * Sets the start production to use.
   */
  Dialect.prototype.setStart = function (value) {
    this.start = value;
    return this;
  };

  Dialect.prototype.getStart = function () {
    return this.start;
  };

  /**
   * Returns this dialect's syntax, building it if necessary.
   */
  Dialect.prototype.getSyntax = function () {
    if (!this.syntax) {
      var syntax = (this.baseSyntaxProvider)();
      var extensions = this.extensionSyntaxProviders.map(function (ext) {
        return ext();
      });
      if (extensions.length > 0) {
        syntax = syntax.compose(extensions);
      }
      this.syntax = syntax;
    }
    return this.syntax;
  };

  /**
   * Returns this dialect's grammar.
   */
  Dialect.prototype.getGrammar = function () {
    if (!this.grammar) {
      this.grammar = this.getSyntax().asGrammar();
    }
    return this.grammar;
  };

  Dialect.prototype.getSettings = function () {
    if (!this.settings) {
      var keywords = this.getKeywords();
      var punctuators = this.getPunctuators();
      this.settings = new TokenizerSettings(keywords, punctuators);
    }
    return this.settings;
  };

  /**
   * Parses the given source, returning a syntax tree.
   */
  Dialect.prototype.parseSource = function (source, origin, trace) {
    var grammar = this.getGrammar();
    var parser = new tedir.Parser(grammar);
    var tokens = tokenize(source, this.getSettings());
    return parser.parse(this.getStart(), tokens, origin, trace);
  };

  Dialect.prototype.translate = function (source, origin, trace) {
    var ast = this.parseSource(source, origin, trace);
    if (trace) {
      return ast;
    }
    // console.log(ast);
    var postAst = ast.translate();
    // console.log(postAst);
    var text = unparse(postAst);
    // console.log(text);
    return text;
  };

  /**
   * Returns the set of keywords used by this dialect.
   */
  Dialect.prototype.getKeywords = function () {
    if (!this.keywords) {
      this.calcTokenTypes();
    }
    return this.keywords;
  };

  /**
   * Returns the set of punctuators used by this dialect.
   */
  Dialect.prototype.getPunctuators = function () {
    if (!this.punctuators) {
      this.calcTokenTypes();
    }
    return this.punctuators;
  };

  /**
   * Scans the grammar and extracts a sorted list of all keywords and
   * punctuators, storing them in the appropriate fields.
   */
  Dialect.prototype.calcTokenTypes = function () {
    var keywordMap = {};
    var punctuatorMap = {};
    function visitNode(node) {
      if (node.getType() == "TOKEN") {
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
    this.getSyntax().forEachRule(function (name, value) {
      visitNode(value);
    });
    this.keywords = Object.keys(keywordMap).sort();
    this.punctuators = Object.keys(punctuatorMap).sort();
  };

  namespace.registerDialect = registerDialect;
  /**
   * Adds the given dialect to the set known by myjs.
   */
  function registerDialect(dialect) {
    dialectRegistry[dialect.getName()] = dialect;
  }

  namespace.getDialect = getDialect;
  /**
   * Returns the specified named dialect, or null if it doesn't exist.
   */
  function getDialect(name) {
    return dialectRegistry[name];
  }

  /**
   * A "hard" token with a string value.
   */
  function HardToken(value, typeOpt) {
    this.value = value;
    this.type = typeOpt || value;
  }

  /**
   * Is this a soft non-semantic token?
   */
  HardToken.prototype.isSoft = function () {
    return false;
  };

  HardToken.prototype.toString = function () {
    if (this.value != this.type) {
      return "[" + this.type + ":" + this.value + "]";
    } else {
      return "[" + this.value + "]";
    }
  };

  /**
   * A "soft" piece of ether that doesn't affect parsing but which we need
   * to keep around to be able to unparse the code again.
   */
  function SoftToken(value) {
    this.value = value;
  }

  SoftToken.prototype.toString = function () {
    return "(" + this.value + ")";
  };

  SoftToken.prototype.isSoft = function () {
    return true;
  };

  namespace.TokenizerSettings = TokenizerSettings;
  function TokenizerSettings(keywords, punctuation) {
    this.keywords = {};
    keywords.forEach(function (word) {
      this.keywords[word] = true;
    }.bind(this));
    this.punctuation = Trie.build(punctuation);
  }

  TokenizerSettings.prototype.isKeyword = function (word) {
    return this.keywords.hasOwnProperty(word);
  };

  TokenizerSettings.prototype.isPunctuation = function (chr) {
    return this.punctuation.get(chr);
  };

  TokenizerSettings.prototype.getPunctuation = function () {
    return this.punctuation;
  };

  namespace.internal.Trie = Trie;
  function Trie(map) {
    this.map = map;
  }

  /**
   * A singleton empty trie.
   */
  Trie.EMPTY = new Trie({});

  /**
   * Returns a trie that matches on the given set of strings.
   */
  Trie.build = function (strings) {
    if (strings.length == 0) {
      return Trie.EMPTY;
    }
    var firstToRest = {};
    strings.forEach(function (string) {
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
    Object.keys(firstToRest).forEach(function (chr) {
      subTries[chr] = Trie.build(firstToRest[chr]);
    });
    return new Trie(subTries);
  };

  Trie.prototype.get = function (chr) {
    return this.map[chr];
  };

  /**
   * A simple stream that provides the contents of a string one char at a
   * time.
   */
  function Scanner(source, settings) {
    this.settings = settings;
    this.source = source;
    this.cursor = 0;
  }

  Scanner.prototype.getCurrent = function () {
    return this.source[this.cursor];
  };

  Scanner.prototype.getLookahead = function () {
    return this.source[this.cursor + 1];
  };

  /**
   * Does this character stream have more characters?
   */
  Scanner.prototype.hasMore = function () {
    return this.cursor < this.source.length;
  };

  Scanner.prototype.hasLookahead = function () {
    return (this.cursor + 1) < this.source.length;
  };

  /**
   * Advances the stream to the next character.
   */
  Scanner.prototype.advance = function () {
    this.cursor++;
  };

  /**
   * Advance the specified amount if possible but not past the end of the
   * input.
   */
  Scanner.prototype.advanceIfPossible = function (amount) {
    this.cursor = Math.min(this.cursor + amount, this.source.length);
  };

  /**
   * Advances the stream to the next character and returns it.
   */
  Scanner.prototype.advanceAndGet = function () {
    this.cursor++;
    return this.getCurrent();
  };

  /**
   * Returns the current character offset.
   */
  Scanner.prototype.getCursor = function () {
    return this.cursor;
  };

  /**
   * Returns the part of the input between 'start' and 'end'.
   */
  Scanner.prototype.getPart = function (start, end) {
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
  Scanner.prototype.scanToken = function () {
    var c = this.getCurrent();
    if (isWhiteSpace(c)) {
      return this.scanWhiteSpace();
    } else if (this.settings.isPunctuation(c)) {
      return this.scanPunctuation();
    } else if (isDigit(c)) {
      return this.scanNumber(c);
    } else if (isIdentifierStart(c)) {
      return this.scanIdentifier(c);
    }
    switch (c) {
    case "\"":
    case "'":
      return this.scanString();
    case "/":
      switch (this.getLookahead()) {
      case "/":
        return this.scanEndOfLineComment();
      case "*":
        return this.scanBlockComment();
      case "=":
        this.advance();
        return this.advanceAndYield("/=");
      default:
        return this.advanceAndYield("/");
      }
    default:
      this.advance();
      return new SoftToken(c);
    }
  };

  /**
   * Doesn't advance but just returns a token with the given contents.
   */
  Scanner.prototype.justYield = function (value, typeOpt) {
    return new HardToken(value, typeOpt);
  };

  /**
   * Skips over the current character and returns a token with the given
   * contents.
   */
  Scanner.prototype.advanceAndYield = function (value, typeOpt) {
    this.advance();
    return new HardToken(value, typeOpt);
  };

  /**
   * Skips over the current character and if the next character matches
   * the given 'match' skips another and return 'ifMatch', otherwise
   * doesn't skip but just returns 'ifNoMatch'.
   */
  Scanner.prototype.checkAndYield = function (match, ifMatch, ifNoMatch) {
    if (this.advanceAndGet() == match) {
      this.advance();
      return new HardToken(ifMatch);
    } else {
      return new HardToken(ifNoMatch);
    }
  };

  /**
   * If the next character is 'single', returns onDouble, otherwise if the
   * next is equality returns onAssignment, otherwise returns single.
   */
  Scanner.prototype.doubleOrAssignment = function (single, onDouble, onAssignment) {
    switch (this.advanceAndGet()) {
    case single:
      return this.advanceAndYield(onDouble);
    case "=":
      return this.advanceAndYield(onAssignment);
    default:
      return this.justYield(single);
    }
  };

  /**
   * Scans a single block of whitespace.
   */
  Scanner.prototype.scanWhiteSpace = function () {
    var start = this.getCursor();
    while (this.hasMore() && isWhiteSpace(this.getCurrent())) {
      this.advance();
    }
    var end = this.getCursor();
    return new SoftToken(this.getPart(start, end));
  };

  Scanner.prototype.scanIdentifier = function () {
    var start = this.getCursor();
    while (this.hasMore() && isIdentifierPart(this.getCurrent())) {
      this.advance();
    }
    var end = this.getCursor();
    var value = this.getPart(start, end);
    if (this.settings.isKeyword(value)) {
      return new HardToken(value);
    } else {
      return new HardToken(value, "Identifier");
    }
  };

  Scanner.prototype.scanPunctuation = function () {
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
    return new HardToken(value);
  };

  Scanner.prototype.scanNumber = function () {
    var start = this.getCursor();
    while (this.hasMore() && isDigit(this.getCurrent())) {
      this.advance();
    }
    var end = this.getCursor();
    var value = this.getPart(start, end);
    return new HardToken(value, "NumericLiteral");
  };

  Scanner.prototype.scanString = function () {
    var start = this.getCursor();
    var first = this.getCurrent();
    this.advance();
    while (this.hasMore() && this.getCurrent() != first) {
      // Skip over escaped characters
      if (this.getCurrent() == "\\") {
        this.advance();
      }
      this.advance();
    }
    this.advanceIfPossible(1);
    var end = this.getCursor();
    var value = this.getPart(start, end);
    return new HardToken(value, "StringLiteral");
  };

  Scanner.prototype.scanEndOfLineComment = function () {
    var start = this.getCursor();
    while (this.hasMore() && (this.getCurrent() != "\n")) {
      this.advance();
    }
    this.advanceIfPossible(1);
    var end = this.getCursor();
    var value = this.getPart(start, end);
    return new SoftToken(value);
  };

  Scanner.prototype.scanBlockComment = function () {
    var start = this.getCursor();
    while (this.hasLookahead() && (this.getCurrent() != "*" || this.getLookahead() != "/")) {
      this.advance();
    }
    this.advanceIfPossible(2);
    var end = this.getCursor();
    var value = this.getPart(start, end);
    return new SoftToken(value);
  };

  namespace.tokenize = tokenize;
  /**
   * Returns the tokens of a piece of JavaScript source code.
   */
  function tokenize(source, settings) {
    var stream = new Scanner(source, settings);
    var tokens = [];
    while (stream.hasMore()) {
      var next = stream.scanToken();
      tokens.push(next);
    }
    return tokens;
  }

  /**
   * Returns a function that will, given a list of values [x0, x1, ..., xn]
   * returns Cons(x0, Cons(x1, Cons(..., xn))).
   */
  function groupRight(Constructor) {
    return function (items) {
      var i, current = items[items.length - 1];
      for (i = items.length - 2; i >= 0; i--) {
        current = new Constructor(items[i], current);
      }
      return current;
    };
  }

  /**
   * Returns a function that will, given a list of values
   * [x0, o0, x1, o1, ..., o_n-1, xn] returns
   * Cons(x0, o0, Cons(x1, o1, Cons(..., o_n-1, xn))).
   */
  function groupInfixRight(Constructor) {
    return function (items) {
      var i, result = items[items.length - 1];
      for (i = items.length - 3; i >= 0; i -= 2) {
        var next = items[i];
        var op = items[i + 1];
        result = new Constructor(next, op, result);
      }
      return result;
    };
  }

  inherits(RegExpHandler, tedir.CustomHandler);
  /**
   * Custom expression used to parse regular expressions.
   */
  function RegExpHandler() { }

  RegExpHandler.prototype.parse = function (context) {
    var input = context.getTokenStream();
    var tokens = [];
    var current = input.getCurrent().value;
    // Scan forward until we meet the end of the input or a "/".
    while (input.hasMore() && (current != "/")) {
      tokens.push(current);
      input.advance();
      current = input.getCurrent().value;
    }
    if (input.hasMore()) {
      input.advance();
      if (input.hasMore() && input.getCurrent().type == "Identifier") {
        tokens += input.getCurrent().value;
        input.advance();
      }
    } else {
      return context.getErrorMarker();
    }
    return tokens;
  };

  var ASSIGNMENT_OPERATORS = ["=", "+=", "-=", "*=", "&=", "|=", "^=", "%=",
    ">>=", ">>>=", "<<="];
  var INFIX_OPERATORS = ["<", "<<", ">", ">>", "|", "||", "==", "!=", "+",
    "===", "&&", "&", "|", "-", "*", "%", "^", "<=", ">=", "!==", "!===",
    ">>>", ">="];
  var INFIX_KEYWORDS = ["instanceof"];
  var PREFIX_OPERATORS = ["++", "--", "+", "-", "~", "!"];
  var PREFIX_KEYWORDS = ["delete", "void", "typeof"];
  var POSTFIX_OPERATORS = ["++", "--"];

  var standardSyntaxCache = null;

  namespace.getStandardSyntax = getStandardSyntax;
  function getStandardSyntax() {
    if (!standardSyntaxCache) {
      standardSyntaxCache = buildStandardSyntax();
    }
    return standardSyntaxCache;
  }

  function buildStandardSyntax() {
    var f = factory;

    var choice = f.choice;
    var custom = f.custom;
    var keyword = f.keyword;
    var keywordValue = f.keywordValue;
    var nonterm = f.nonterm;
    var option = f.option;
    var plus = f.plus;
    var punct = f.punct;
    var punctValue = f.punctValue;
    var seq = f.seq;
    var star = f.star;
    var token = f.token;
    var value = f.value;

    var syntax = new tedir.Syntax();

    // <Program>
    //   -> <SourceElement>*
    syntax.getRule("Program")
      .addProd(star(nonterm("SourceElement")))
      .setConstructor(ast.Program);

    // <SourceElement>
    //   -> <FunctionDeclaration>
    //   -> <Statement>
    syntax.getRule("SourceElement")
      .addProd(nonterm("FunctionDeclaration"))
      .addProd(nonterm("Statement"));

    // <FunctionDeclaration>
    //   -> "function" $Identifier "(" <FormalParameterList> ")" "{" <FunctionBody> "}"
    syntax.getRule("FunctionDeclaration")
      .addProd(keyword("function"), value("Identifier"), punct("("),
        nonterm("FormalParameterList"), punct(")"), punct("{"),
        nonterm("FunctionBody"), punct("}"))
      .setConstructor(ast.FunctionDeclaration);

    // <FormalParameterList>
    //   -> $Identifier *: ","
    syntax.getRule("FormalParameterList")
      .addProd(star(value("Identifier"), punct(",")));

    // <FunctionBody>
    //   -> <SourceElement>*
    syntax.getRule("FunctionBody")
      .addProd(star(nonterm("SourceElement")));

    // <Statement>
    //   -> <Block>
    //   -> <VariableStatement>
    //   -> <ExpressionStatement>
    //   -> <IfStatement>
    //   -> <IterationStatement>
    //   -> <ReturnStatement>
    //   -> <ContinueStatement>
    //   -> <SwitchStatement>
    //   -> <ThrowStatement>
    //   -> <TryStatement>
    syntax.getRule("Statement")
      .addProd(nonterm("Block"))
      .addProd(nonterm("VariableStatement"))
      .addProd(nonterm("ExpressionStatement"))
      .addProd(nonterm("IfStatement"))
      .addProd(nonterm("IterationStatement"))
      .addProd(nonterm("ReturnStatement"))
      .addProd(nonterm("ContinueStatement"))
      .addProd(nonterm("SwitchStatement"))
      .addProd(nonterm("ThrowStatement"))
      .addProd(nonterm("TryStatement"));

    // <Block>
    //   -> "{" <Statement>* "}"
    syntax.getRule("Block")
      .addProd(punct("{"), star(nonterm("Statement")), punct("}"))
      .setConstructor(ast.Block);

    // <VariableStatement>
    //   -> "var" <VariableDeclaration> +: "," ";"
    syntax.getRule("VariableStatement")
      .addProd(keyword("var"), plus(nonterm("VariableDeclaration"), punct(",")),
        punct(";"))
      .setConstructor(ast.VariableStatement);

    // <ExpressionStatement>
    //   -> <Expression> ";"
    syntax.getRule("ExpressionStatement")
      .addProd(nonterm("Expression"), punct(";"))
      .setConstructor(ast.ExpressionStatement);

    // <IfStatement>
    //   -> "if" "(" <Expression> ")" <Statement> ("else" <Statement>)?
    syntax.getRule("IfStatement")
      .addProd(keyword("if"), punct("("), nonterm("Expression"), punct(")"),
        nonterm("Statement"), option(keyword("else"), nonterm("Statement")))
      .setConstructor(ast.IfStatement);

    // <IterationStatement>
    //   -> "do" <Statement> "while" "(" <Expression> ")" ";"
    //   -> "while" "(" <Expression> ")" <Statement>
    //   -> "for" "(" "var" <VariableDeclaration> ";" <Expression>? ";" <Expression>? ")" <Statement>
    //   -> "for" "(" <Expression>? ";" <Expression>? ";" <Expression>? ")" <Statement>
    //   -> "for" "(" "var" <VariableDeclaration> "in"  <Expression> ")" <Statement>
    syntax.getRule("IterationStatement")
      .addProd(keyword("do"), nonterm("Statement"), keyword("while"),
        punct("("), nonterm("Expression"), punct(")"), punct(";"))
      .setConstructor(ast.DoStatement)
      .addProd(keyword("while"), punct("("), nonterm("Expression"), punct(")"),
        nonterm("Statement"))
      .setConstructor(ast.WhileStatement)
      .addProd(keyword("for"), punct("("), keyword("var"),
        nonterm("VariableDeclaration"), punct(";"),
        option(nonterm("Expression")), punct(";"),
        option(nonterm("Expression")), punct(")"), nonterm("Statement"))
      .setConstructor(ast.ForStatement)
      .addProd(keyword("for"), punct("("), option(nonterm("Expression")),
        punct(";"), option(nonterm("Expression")), punct(";"),
        option(nonterm("Expression")), punct(")"), nonterm("Statement"))
      .setConstructor(ast.ForStatement)
      .addProd(keyword("for"), punct("("), keyword("var"),
        nonterm("VariableDeclaration"), keyword("in"),
        nonterm("Expression"), punct(")"), nonterm("Statement"))
      .setConstructor(ast.ForInStatement);

    // <ContinueStatement>
    //   -> "continue" $Identifier? ";"
    syntax.getRule("ContinueStatement")
      .addProd(keyword("continue"), option(value("Identifier")), punct(";"))
      .setConstructor(ast.ContinueStatement);

    // <SwitchStatement>
    //   -> "switch" "(" <Expression> ")" <CaseBlock>
    syntax.getRule("SwitchStatement")
      .addProd(keyword("switch"), punct("("), nonterm("Expression"),
        punct(")"), nonterm("CaseBlock"))
      .setConstructor(ast.SwitchStatement);

    // <CaseBlock>
    //   -> "{" (<CaseClause>|<DefaultClause>)* "}"
    syntax.getRule("CaseBlock")
      .addProd(punct("{"), star(choice(nonterm("CaseClause"), nonterm("DefaultClause"))), punct("}"));

    // <CaseClause>
    //   -> "case" <Expression> ":" <Statement>*
    syntax.getRule("CaseClause")
      .addProd(keyword("case"), nonterm("Expression"), punct(":"),
        star(nonterm("Statement")))
      .setConstructor(ast.SwitchCase);

    // <DefaultClause>
    //   // -> "default" ":" <Statement>*
    syntax.getRule("DefaultClause")
      .addProd(keyword("default"), punct(":"), star(nonterm("Statement")))
      .setHandler(buildDefaultCase);

    function buildDefaultCase(body) {
      return new ast.SwitchCase(null, body);
    }

    // <ThrowStatement>
    //   -> "throw" <Expression> ";"
    syntax.getRule("ThrowStatement")
      .addProd(keyword("throw"), nonterm("Expression"), punct(";"))
      .setConstructor(ast.ThrowStatement);

    // <TryStatement>
    //   -> "try" <Block> <Catch>? <Finally>?
    syntax.getRule("TryStatement")
      .addProd(keyword("try"), nonterm("Block"), option(nonterm("Catch")),
        option(nonterm("Finally")));

    // <Catch>
    //   -> "catch" "(" $Identifier ")" <Block>
    syntax.getRule("Catch")
      .addProd(keyword("catch"), punct("("), value("Identifier"), punct(")"),
        nonterm("Block"));

    // <Finally>
    //   -> "finally" <Block>
    syntax.getRule("Finally")
      .addProd(keyword("finally"), nonterm("Block"));

    // <VariableDeclaration>
    //   -> $Identifier ("=" <AssignmentExpression>)?
    syntax.getRule("VariableDeclaration")
      .addProd(value("Identifier"), option(punct("="),
        nonterm("AssignmentExpression")))
      .setConstructor(ast.VariableDeclaration);

    // <ReturnStatement>
    //   -> "return" <Expression>? ";"
    syntax.getRule("ReturnStatement")
      .addProd(keyword("return"), option(nonterm("Expression")), punct(";"))
      .setConstructor(ast.ReturnStatement);

    // <Expression>
    //   -> <AssignmentExpression> +: ","
    syntax.getRule("Expression")
      .addProd(plus(nonterm("AssignmentExpression"), punct(",")))
      .setHandler(groupRight(ast.SequenceExpression));

    // <AssignmentExpression>
    //   -> <OperatorExpression> +: <AssignmentOperator>
    syntax.getRule("AssignmentExpression")
      .addProd(plus(nonterm("ConditionalExpression"), nonterm("AssignmentOperator")))
      .setHandler(groupInfixRight(ast.AssignmentExpression));

    // <ConditionalExpression>
    //   -> <OperatorExpression> ("?" <OperatorExpression> ":" <OperatorExpression>)?
    syntax.getRule("ConditionalExpression")
      .addProd(nonterm("OperatorExpression"), option(punct("?"),
        nonterm("OperatorExpression"), punct(":"),
        nonterm("OperatorExpression")))
      .setHandler(buildConditional);

    function buildConditional(cond, rest) {
      if (!rest) {
        return cond;
      } else {
        return new ast.ConditionalExpression(cond, rest[0], rest[1]);
      }
    }

    // <AssignmentOperator>
    //   -> ... assignment operators ...
    ASSIGNMENT_OPERATORS.forEach(function (op) {
      syntax.getRule("AssignmentOperator")
        .addProd(punctValue(op));
    });

    // <OperatorExpression>
    //   <UnaryExpression> +: <InfixToken>
    syntax.getRule("OperatorExpression")
      .addProd(plus(nonterm("UnaryExpression"), nonterm("InfixToken")))
      .setHandler(groupInfixRight(ast.InfixExpression));

    // <InfixToken>
    //   -> ... infix operators ...
    //   -> ... infix keywords ...
    INFIX_OPERATORS.forEach(function (op) {
      syntax.getRule("InfixToken")
        .addProd(punctValue(op));
    });
    INFIX_KEYWORDS.forEach(function (word) {
      syntax.getRule("InfixToken")
        .addProd(keywordValue(word));
    });

    // <UnaryExpression>
    //   -> <PrefixToken>* <LeftHandSideExpression> <PostfixOperator>*
    syntax.getRule("UnaryExpression")
      .addProd(star(nonterm("PrefixToken")), nonterm("LeftHandSideExpression"),
        star(nonterm("PostfixOperator")))
      .setHandler(buildUnary);

    function buildUnary(prefix, value, postfix) {
      var i, current = value;
      for (i = 0; i < postfix.length; i++) {
        current = new ast.UnaryExpression(current, postfix[i],
          ast.UnaryExpression.POSTFIX);
      }
      for (i = prefix.length - 1; i >= 0; i--) {
        current = new ast.UnaryExpression(current, prefix[i],
          ast.UnaryExpression.PREFIX);
      }
      return current;
    }

    // <PrefixToken>
    //   -> ... prefix operators ...
    //   -> ... prefix keywords ...
    PREFIX_OPERATORS.forEach(function (op) {
      syntax.getRule("PrefixToken")
        .addProd(punctValue(op));
    });
    PREFIX_KEYWORDS.forEach(function (word) {
      syntax.getRule("PrefixToken")
        .addProd(keywordValue(word));
    });

    // <PostfixOperator>
    //   -> ... postfix operators ...
    POSTFIX_OPERATORS.forEach(function (op) {
      syntax.getRule("PostfixOperator")
        .addProd(value(op));
    });

    // <LeftHandSideExpression>
    //   -> "new"* <LeftHandSideAtom> <LeftHandSideSuffix>*
    syntax.getRule("LeftHandSideExpression")
      .addProd(star(keywordValue("new")), nonterm("LeftHandSideAtom"),
        star(nonterm("LeftHandSideSuffix")))
      .setHandler(buildLeftHandSideExpression);

    function buildLeftHandSideExpression(news, atom, suffixes) {
      var i, current = atom;
      var newCount = news.length;
      // Scan through the suffixes from left to right and apply them
      // appropriately.
      for (i = 0; i < suffixes.length; i++) {
        var suffix = suffixes[i];
        if (suffix.isArguments() && newCount > 0) {
          // If this is argument suffix we match it with a "new" if there is
          // one.
          current = suffix.wrapNew(current);
          newCount--;
        } else {
          // Otherwise we just apply the suffix and keep going.
          current = suffix.wrapPlain(current);
        }
      }
      // Any news that weren't matched by arguments have implicit empty
      // arguments.
      for (i = 0; i < newCount; i++) {
        current = new ArgumentsSuffix([]).wrapNew(current);
      }
      return current;
    }

    // <LeftHandSideAtom>
    //   -> <FunctionExpression>
    //   -> <PrimaryExpression>
    syntax.getRule("LeftHandSideAtom")
      .addProd(nonterm("PrimaryExpression"))
      .addProd(nonterm("FunctionExpression"));

    // <LeftHandSideSuffix>
    //   -> "[" <Expression> "]"
    //   -> "." $Identifier
    //   -> <Arguments>
    syntax.getRule("LeftHandSideSuffix")
      .addProd(punct("["), nonterm("Expression"), punct("]"))
      .setConstructor(GetElementSuffix)
      .addProd(punct("."), value("Identifier"))
      .setConstructor(GetPropertySuffix)
      .addProd(nonterm("Arguments"))
      .setConstructor(ArgumentsSuffix);

    function GetElementSuffix(value) {
      this.value = value;
    }

    GetElementSuffix.prototype.isArguments = function () {
      return false;
    };

    GetElementSuffix.prototype.wrapPlain = function (atom) {
      return new ast.GetElementExpression(atom, this.value);
    };

    function GetPropertySuffix(name) {
      this.name = name;
    }

    GetPropertySuffix.prototype.isArguments = function () {
      return false;
    };

    GetPropertySuffix.prototype.wrapPlain = function (atom) {
      return new ast.GetPropertyExpression(atom, this.name);
    };

    function ArgumentsSuffix(args) {
      this.args = args;
    }

    ArgumentsSuffix.prototype.isArguments = function () {
      return true;
    };

    ArgumentsSuffix.prototype.wrapPlain = function (atom) {
      return new ast.CallExpression(atom, this.args);
    };

    ArgumentsSuffix.prototype.wrapNew = function (atom) {
      return new ast.NewExpression(atom, this.args);
    };

    // <FunctionExpression>
    //   -> "function" $Identifier? "(" <FormalParameterList> ")" "{" <FunctionBody> "}"
    syntax.getRule("FunctionExpression")
      .addProd(keyword("function"), option(value("Identifier")), punct("("),
        nonterm("FormalParameterList"), punct(")"), punct("{"),
        nonterm("FunctionBody"), punct("}"))
      .setConstructor(ast.FunctionExpression);

    // <Arguments>
    //   -> "(" <AssignmentExpression> *: "," ")"
    syntax.getRule("Arguments")
      .addProd(punct("("), star(nonterm("AssignmentExpression"), punct(",")),
        punct(")"));

    // <PrimaryExpression>
    //   -> $Identifier
    //   -> <Literal>
    //   -> <ArrayLiteral>
    //   -> <ObjectLiteral>
    //   -> "(" <Expression> ")"
    syntax.getRule("PrimaryExpression")
      .addProd(keyword("this"))
      .setConstructor(ast.This)
      .addProd(value("Identifier"))
      .setConstructor(ast.Identifier)
      .addProd(nonterm("Literal"))
      .addProd(nonterm("ArrayLiteral"))
      .addProd(nonterm("ObjectLiteral"))
      .addProd(punct("("), nonterm("Expression"), punct(")"));

    // <ObjectLiteral>
    //   -> "{" <PropertyAssignment> *: "," "}"
    syntax.getRule("ObjectLiteral")
      .addProd(punct("{"), star(nonterm("PropertyAssignment"), punct(",")),
        punct("}"))
      .setConstructor(ast.ObjectLiteral);

    // <PropertyAssignment>
    //   -> <PropertyName> ":" <AssignmentExpression>
    syntax.getRule("PropertyAssignment")
      .addProd(nonterm("PropertyName"), punct(":"),
        nonterm("AssignmentExpression"));

    // <PropertyName>
    //   -> $Identifier
    //   -> $StringLiteral
    //   -> $NumericLiteral
    syntax.getRule("PropertyName")
      .addProd(value("Identifier"))
      .addProd(value("StringLiteral"))
      .addProd(value("NumericLiteral"));

    // <ArrayLiteral>
    //   -> "[" <AssignmentExpression> *: "," "]"
    syntax.getRule("ArrayLiteral")
      .addProd(punct("["), star(nonterm("AssignmentExpression"), punct(",")),
        punct("]"))
      .setConstructor(ast.ArrayLiteral);

    // <Literal>
    //   -> $NumericLiteral
    //   -> $StringLiteral
    //   -> <RegularExpressionLiteral>
    syntax.getRule("Literal")
      .addProd(value("NumericLiteral"))
      .setConstructor(ast.Literal)
      .addProd(value("StringLiteral"))
      .setConstructor(ast.Literal)
      .addProd(nonterm("RegularExpressionLiteral"))
      .setConstructor(ast.Literal);

    // <RegularExpressionLiteral>
    //   -> "/" [<RegularExpressionBody> "/" RegularExpressionFlags]
    syntax.getRule("RegularExpressionLiteral")
      .addProd(token("/"), custom(new RegExpHandler()));

    return syntax;
  }

  function unparse(node) {
    var settings = {
      newline: "\n",
      indent: "  "
    };
    var out = new ast.internal.TextFormatter(settings);
    node.unparse(out);
    return out.flush();
  }

  function registerBuiltInDialects() {
    registerDialect(new Dialect("default"));
  }

  namespace.getSource = function () {
    return String(defineMyJs);
  };

  registerBuiltInDialects();
  return namespace;
}

if (typeof module == "undefined") {
  this.myjs = this.myjs || defineMyJs({}, this);
} else {
  defineMyJs(module.exports, {
    utils: require('./utils'),
    ast: require('./ast'),
    tedir: require('./tedir')
  });
}

}).call(this);

