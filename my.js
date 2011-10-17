"use strict";

// Declare namespace
var myjs = myjs || (function defineMyJs(namespace) { // offset: 3

  namespace.ast = namespace.ast || {};
  var ast = namespace.ast;

  var dialectRegistry = {};

  namespace.Dialect = Dialect;
  /**
   * A description of a javascript dialect.
   */
  function Dialect(name) {
    this.name = name;
    this.syntaxProvider = null;
    this.syntax = null;
    this.grammar = null;
    this.start = null;
    this.keywords = null;
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
  Dialect.prototype.setSyntaxProvider = function (value) {
    this.syntaxProvider = value;
    return this;
  };

  /**
   * Sets the start production to use.
   */
  Dialect.prototype.setStart = function (value) {
    this.start = value;
    return this;
  };

  /**
   * Returns this dialect's syntax, building it if necessary.
   */
  Dialect.prototype.getSyntax = function () {
    if (!this.syntax) {
      this.syntax = (this.syntaxProvider)();
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
      this.settings = new TokenizerSettings(keywords);
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
    return parser.parse(this.start, tokens, origin, trace);
  };

  /**
   * Returns the set of keywords used by this dialect.
   */
  Dialect.prototype.getKeywords = function () {
    if (!this.keywords) {
      this.keywords = this.calcKeywords();
    }
    return this.keywords;
  };

  /**
   * Scans the grammar and extracts a sorted list of all keywords.
   */
  Dialect.prototype.calcKeywords = function () {
    var keywordMap = {};
    function visitNode(node) {
      if (node.getType() == "TOKEN") {
        if (node.isKeyword) {
          keywordMap[node.value] = true;
        }
      } else {
        node.forEachChild(visitNode);
      }
    }
    this.getSyntax().forEachRule(function (name, value) {
      visitNode(value);
    });
    return Object.keys(keywordMap).sort();
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
  function TokenizerSettings(keywords) {
    this.keywords = {};
    keywords.forEach(function (word) {
      this.keywords[word] = true;
    }.bind(this));
  }

  TokenizerSettings.prototype.isKeyword = function (word) {
    return this.keywords[word];
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

  /**
   * Advances the stream to the next character.
   */
  Scanner.prototype.advance = function () {
    this.cursor++;
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

  var SHORT_DELIMITERS = "(),:;?[]{}~.";
  var SHORT_DELIMITER_MAP = {};
  var i;
  for (i = 0; i < SHORT_DELIMITERS.length; i++) {
    SHORT_DELIMITER_MAP[SHORT_DELIMITERS[i]] = true;
  }

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
    } else if (SHORT_DELIMITER_MAP[c]) {
      return this.produce(c);
    } else if (isDigit(c)) {
      return this.scanNumber(c);
    } else if (isIdentifierStart(c)) {
      return this.scanIdentifier(c);
    }
    switch (c) {
    case "\"":
    case "'":
      return this.scanString();
    case "=":
      if (this.advanceAndGet() == "=") {
        return this.produceWithFallback("=", "===", "==");
      } else {
        return new HardToken("=");
      }
    case ">":
      return this.produceWithFallback(">", ">>", ">");
    case "<":
      return this.produceWithFallback("<", "<<", "<");
    case "+":
      switch (this.advanceAndGet()) {
      case "+":
        return this.produce("++");
      case "=":
        return this.produce("+=");
      default:
        return new HardToken("+");
      }
    case "/":
      if (this.getLookahead() == "/") {
        return this.scanEndOfLineComment();
      } else {
        this.advance();
        return c;
      }
    default:
      this.advance();
      return c;
    }
  };

  /**
   * Skips over the current character and returns a token with the given
   * contents.
   */
  Scanner.prototype.produce = function (value, typeOpt) {
    this.advance();
    return new HardToken(value, typeOpt);
  };

  /**
   * Skips over the current character and if the next character matches
   * the given 'match' skips another and return 'ifMatch', otherwise
   * return 'ifNoMatch'.
   */
  Scanner.prototype.produceWithFallback = function (match, ifMatch, ifNoMatch) {
    if (this.advanceAndGet() == match) {
      this.advance();
      return new HardToken(ifMatch);
    } else {
      return new HardToken(ifNoMatch);
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
    var first = this.getCurrent();
    this.advance();
    var start = this.getCursor();
    while (this.hasMore() && this.getCurrent() != first) {
      this.advance();
    }
    var end = this.getCursor();
    if (this.hasMore()) {
      this.advance();
    }
    var value = this.getPart(start, end);
    return new HardToken(value, "StringLiteral");
  };

  Scanner.prototype.scanEndOfLineComment = function () {
    var start = this.getCursor();
    while (this.hasMore() && (this.getCurrent() != "\n")) {
      this.advance();
    }
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

  var PLAIN_OPS = ["<", "<<", ">", ">>"];

  namespace.getStandardSyntax = getStandardSyntax;
  function getStandardSyntax() {
    var f = tedir.factory;

    var choice = f.choice;
    var keyword = f.keyword;
    var nonterm = f.nonterm;
    var option = f.option;
    var plus = f.plus;
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
      .addProd(keyword("function"), value("Identifier"), token("("),
        nonterm("FormalParameterList"), token(")"), token("{"),
        nonterm("FunctionBody"), token("}"))
      .setConstructor(ast.FunctionDeclaration);

    // <FormalParameterList>
    //   -> $Identifier *: ","
    syntax.getRule("FormalParameterList")
      .addProd(star(value("Identifier"), token(",")));

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
    syntax.getRule("Statement")
      .addProd(nonterm("Block"))
      .addProd(nonterm("VariableStatement"))
      .addProd(nonterm("ExpressionStatement"))
      .addProd(nonterm("IfStatement"))
      .addProd(nonterm("IterationStatement"))
      .addProd(nonterm("ReturnStatement"))
      .addProd(nonterm("ContinueStatement"));

    // <Block>
    //   -> "{" <Statement>* "}"
    syntax.getRule("Block")
      .addProd(token("{"), star(nonterm("Statement")), token("}"))
      .setConstructor(ast.Block);

    // <VariableStatement>
    //   -> "var" <VariableDeclaration> +: "," ";"
    syntax.getRule("VariableStatement")
      .addProd(keyword("var"), plus(nonterm("VariableDeclaration"), token(",")),
        token(";"))
      .setConstructor(ast.VariableStatement);

    // <ExpressionStatement>
    //   -> <Expression> ";"
    syntax.getRule("ExpressionStatement")
      .addProd(nonterm("Expression"), token(";"))
      .setConstructor(ast.ExpressionStatement);

    // <IfStatement>
    //   -> "if" "(" <Expression> ")" <Statement> ("else" <Statement>)?
    syntax.getRule("IfStatement")
      .addProd(keyword("if"), token("("), nonterm("Expression"), token(")"),
        nonterm("Statement"), option(keyword("else"), nonterm("Statement")))
      .setConstructor(ast.IfStatement);

    // <IterationStatement>
    //   -> "do" <Statement> "while" "(" <Expression> ")" ";"
    //   -> "while" "(" <Expression> ")" <Statement>
    //   -> "for" "(" <Expression>? ";" <Expression>? ";" <Expression>? ")" <Statement>
    syntax.getRule("IterationStatement")
      .addProd(keyword("do"), nonterm("Statement"), keyword("while"),
        token("("), nonterm("Expression"), token(")"), token(";"))
      .setConstructor(ast.DoStatement)
      .addProd(keyword("while"), token("("), nonterm("Expression"), token(")"),
        nonterm("Statement"))
      .setConstructor(ast.WhileStatement)
      .addProd(keyword("for"), token("("), option(nonterm("Expression")),
        token(";"), option(nonterm("Expression")), token(";"),
        option(nonterm("Expression")), token(")"), nonterm("Statement"))
      .setConstructor(ast.ForStatement);

    // <ContinueStatement>
    //   -> "continue" $Identifier? ";"
    syntax.getRule("ContinueStatement")
      .addProd(keyword("continue"), option(value("Identifier")), token(";"))
      .setConstructor(ast.ContinueStatement);

    // <VariableDeclaration>
    //   -> $Identifier ("=" <AssignmentExpression>)?
    syntax.getRule("VariableDeclaration")
      .addProd(value("Identifier"), option(token("="),
        nonterm("AssignmentExpression")))
      .setConstructor(ast.VariableDeclaration);

    // <ReturnStatement>
    //   -> "return" <Expression>? ";"
    syntax.getRule("ReturnStatement")
      .addProd(keyword("return"), option(nonterm("Expression")), token(";"))
      .setConstructor(ast.ReturnStatement);

    // <Expression>
    //   -> <AssignmentExpression> +: ","
    syntax.getRule("Expression")
      .addProd(plus(nonterm("AssignmentExpression"), token(",")));

    // <AssignmentExpression>
    //   -> <OperatorExpression> +: <AssignmentOperator>
    syntax.getRule("AssignmentExpression")
      .addProd(plus(nonterm("OperatorExpression"), nonterm("AssignmentOperator")));

    // <OperatorExpression>
    //   <MemberExpression> +: <PlainOperator>
    syntax.getRule("OperatorExpression")
      .addProd(plus(nonterm("MemberExpression"), nonterm("PlainOperator")));

    // <PlainOperator>
    //   -> ... operators ...
    syntax.getRule("PlainOperator")
      .addProd(choice.apply(PLAIN_OPS.map(token)));

    // <AssignmentOperator>
    //   -> "="
    syntax.getRule("AssignmentOperator")
      .addProd(token("="));

    // <MemberExpression>
    //   -> <PrimaryExpression> <MemberAccessor>*
    //   -> "new" <MemberExpression> <Arguments>
    //   -> <FunctionExpression>
    syntax.getRule("MemberExpression")
      .addProd(nonterm("PrimaryExpression"), star(nonterm("MemberAccessor")))
      .addProd(keyword("new"), nonterm("MemberExpression"), nonterm("Arguments"))
      .addProd(nonterm("FunctionExpression"));

    // <FunctionExpression>
    //   -> "function" $Identifier? "(" <FormalParameterList> ")" "{" <FunctionBody> "}"
    syntax.getRule("FunctionExpression")
      .addProd(keyword("function"), option(value("Identifier")), token("("),
        nonterm("FormalParameterList"), token(")"), token("{"),
        nonterm("FunctionBody"), token("}"))
      .setConstructor(ast.FunctionExpression);

    // <MemberAccessor>
    //   -> "[" <Expression> "]"
    //   -> <Arguments>
    //   -> "." $Identifier
    syntax.getRule("MemberAccessor")
      .addProd(token("["), nonterm("Expression"), token("]"))
      .addProd(nonterm("Arguments"))
      .addProd(token("."), value("Identifier"));

    // <Arguments>
    //   -> "(" <AssignmentExpression> *: "," ")"
    syntax.getRule("Arguments")
      .addProd(token("("), star(nonterm("AssignmentExpression"), token(",")),
        token(")"));

    // <PrimaryExpression>
    //   -> $Identifier
    //   -> <Literal>
    //   -> "(" <Expression> ")"
    syntax.getRule("PrimaryExpression")
      .addProd(keyword("this"))
      .addProd(value("Identifier"))
      .addProd(nonterm("Literal"))
      .addProd(token("("), nonterm("Expression"), token(")"));

    // <Literal>
    //   -> $NumericLiteral
    //   -> $StringLiteral
    syntax.getRule("Literal")
      .addProd(value("NumericLiteral"))
      .addProd(value("StringLiteral"));

    return syntax;
  }

  function registerBuiltInDialects() {
    // Default
    var defhault = new Dialect("default")
      .setSyntaxProvider(getStandardSyntax)
      .setStart("Program");
    registerDialect(defhault);
  }

  namespace.getSource = function () {
    return String(defineMyJs);
  };

  registerBuiltInDialects();
  return namespace;
})({});
