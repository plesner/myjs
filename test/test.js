"use strict";

var keyword = tedir.factory.keyword;
var nonterm = tedir.factory.nonterm;
var plus = tedir.factory.plus;
var seq = tedir.factory.seq;
var star = tedir.factory.star;
var token = tedir.factory.token;
var value = tedir.factory.value;
var toArray = tedir.internal.toArray;

function testDefined() {
  assertTrue(tedir);
  assertTrue(myjs);
}

function getExpressionSyntax() {
  var syntax = new tedir.Syntax();

  // <expr>
  //   -> <atom> +: "+"
  syntax.getRule("expr")
      .addProd(plus(nonterm("atom"), token("+")));

  // <atom>
  //   -> $NumericLiteral
  //   |  "(" <expr> ")"
  syntax.getRule("atom")
      .addProd(value("NumericLiteral"))
      .addProd(token("("), nonterm("expr"), token(")"));

  return syntax;
}

var DEFAULT_SETTINGS = new myjs.TokenizerSettings(["a", "b", "c", "for"]);
/**
 * Given a syntax and a start production, returns a function that can be
 * called with the expected output and a source and that will test that
 * parsing it produces the expected value. If a function is passed as the
 * expected value we'll check that an error is thrown that is an instance
 * of that function.
 */
function getParserTestRunner(syntax, startOpt) {
  var start = startOpt || "start";
  return function (expected, source) {
    var parser = new tedir.Parser(syntax);
    var tokens = myjs.tokenize(source, DEFAULT_SETTINGS);
    if (typeof expected == 'function') {
      try {
        parser.parse(start, tokens);
        fail();
      } catch (e) {
        assertTrue(e instanceof expected);
      }
    } else {
      assertListEquals(expected, parser.parse(start, tokens));
    }
  };
}

function testSimpleExpressions() {
  var run = getParserTestRunner(getExpressionSyntax(), "expr");
  run([10], "10");
  run([11, 12], "11 + 12");
  run([13, 14, 15], "13 + 14 + 15");
  run([[16, 17, 18]], "(16 + 17 + 18)");
  run([[19, [20, 21]]], "(19 + (20 + 21))");
  run([[[22, 23], [24, 25]]], "((22 + 23) + (24 + 25))");
}

function testTokenValues() {
  var syntax = new tedir.Syntax();
  var f = tedir.factory;

  syntax.getRule("start")
    .addProd(f.token("a"))
    .addProd(f.value("b"))
    .addProd(f.ignore(f.value("[")));

  var run = getParserTestRunner(syntax);
  run(null, "a");
  run("b", "b");
  run(null, "[");
}

function testSimpleErrors() {
  var run = getParserTestRunner(getExpressionSyntax(), "expr");
  run(tedir.SyntaxError, "10 10 10");
}

function testSequences() {
  var syntax = new tedir.Syntax();

  syntax.getRule("start")
    .addProd(token("?"), seq(token("a")))
    .addProd(token(","), seq(value("a")))
    .addProd(token("["), seq(value("a"), value("b")))
    .addProd(token("]"), seq(token("a"), value("b")))
    .addProd(token("("), seq(value("a"), token("b")))
    .addProd(token(")"), seq(token("a"), token("b")))
    .addProd(token("{"), seq(token("a"), token("b"), token("c")))
    .addProd(token("}"), seq(value("a"), token("b"), value("c")));

  var run = getParserTestRunner(syntax);
  run(null, "? a");
  run("a", ", a");
  run(["a", "b"], "[ a b");
  run("b", "] a b");
  run("a", "( a b");
  run(null, ") a b");
  run(["a", "c"], "} a b c");
}

function testNestedSequences() {
  var syntax = new tedir.Syntax();

  syntax.getRule("start")
    .addProd(token("?"), seq(value("a"), seq(value("b"), value("c"))))
    .addProd(token(","), seq(value("a"), seq(token("b"), value("c"))))
    .addProd(token("["), seq(value("a"), seq(token("b"), token("c"))));

  var run = getParserTestRunner(syntax);
  run(["a", ["b", "c"]], "? a b c");
  run(["a", "c"], ", a b c");
  run("a", "[ a b c");
}

function testRepeatValues() {
  var syntax = new tedir.Syntax();

  syntax.getRule("start")
    .addProd(token("["), star(value("a"), value("b")))
    .addProd(token("]"), star(token("a"), value("b")))
    .addProd(token("("), star(value("a"), token("b")))
    .addProd(token(")"), star(token("a"), token("b")));

  var run = getParserTestRunner(syntax);
  run([], "[");
  run(["a"], "[ a");
  run(["a", "b", "a"], "[ a b a");
  run(["a", "b", "a", "b", "a"], "[ a b a b a");
  run(tedir.SyntaxError, "[ a b");

  run([], "]");
  run([], "] a");
  run(["b"], "] a b a");
  run(["b", "b"], "] a b a b a");
  run(tedir.SyntaxError, "] a b");

  run([], "(");
  run(["a"], "( a");
  run(["a", "a"], "( a b a");
  run(["a", "a", "a"], "( a b a b a");
  run(tedir.SyntaxError, "( a b");

  run([], ")");
  run([], ") a");
  run([], ") a b a");
  run([], ") a b a b a");
  run(tedir.SyntaxError, ") a b");
}

function testInvoker() {
  var Invoker = tedir.internal.Invoker;
  var lastArgs; // The last args passed to a constructor.

  // 0
  var zeroCall = Invoker.forArity(0, false, function () {
    assertEquals(null, this);
    return toArray(arguments);
  });
  assertListEquals([], zeroCall([]));
  assertListEquals([1], zeroCall([1]));
  assertListEquals([1, 2], zeroCall([1, 2]));

  function ZeroConstructor() {
    assertTrue(this instanceof ZeroConstructor);
    assertEquals(0, arguments.length);
    lastArgs = toArray(arguments);
  }
  var zeroCons = Invoker.forArity(0, true, ZeroConstructor);
  assertTrue(zeroCons([]) instanceof ZeroConstructor);
  assertListEquals([], lastArgs);
  assertTrue(zeroCons([1]) instanceof ZeroConstructor);
  assertListEquals([], lastArgs);
  assertTrue(zeroCons([1, 2]) instanceof ZeroConstructor);
  assertListEquals([], lastArgs);

  // 1
  var oneCall = Invoker.forArity(1, false, function (arg) {
    assertEquals(null, this);
    return toArray(arguments);
  });
  assertListEquals([[]], oneCall([]));
  assertListEquals([[1]], oneCall([1]));
  assertListEquals([[1, 2]], oneCall([1, 2]));

  function OneConstructor(arg) {
    assertTrue(this instanceof OneConstructor);
    assertEquals(1, arguments.length);
    lastArgs = toArray(arguments);
  }
  var oneCons = Invoker.forArity(1, true, OneConstructor);
  assertTrue(oneCons([]) instanceof OneConstructor);
  assertListEquals([[]], lastArgs);
  assertTrue(oneCons([1]) instanceof OneConstructor);
  assertListEquals([[1]], lastArgs);
  assertTrue(oneCons([1, 2]) instanceof OneConstructor);
  assertListEquals([[1, 2]], lastArgs);

  // 2
  var twoCall = Invoker.forArity(2, false, function (arg1, arg2) {
    assertEquals(null, this);
    return toArray(arguments);
  });
  assertListEquals([], twoCall([]));
  assertListEquals([1], twoCall([1]));
  assertListEquals([1, 2], twoCall([1, 2]));
  assertListEquals([1, 2, 3], twoCall([1, 2, 3]));

  function TwoConstructor(arg) {
    assertTrue(this instanceof TwoConstructor);
    assertEquals(2, arguments.length);
    lastArgs = toArray(arguments);
  }
  var twoCons = Invoker.forArity(2, true, TwoConstructor);
  assertTrue(twoCons([]) instanceof TwoConstructor);
  assertListEquals([undefined, undefined], lastArgs);
  assertTrue(twoCons([1]) instanceof TwoConstructor);
  assertListEquals([1, undefined], lastArgs);
  assertTrue(twoCons([1, 2]) instanceof TwoConstructor);
  assertListEquals([1, 2], lastArgs);
  assertTrue(twoCons([1, 2, 3]) instanceof TwoConstructor);
  assertListEquals([1, 2], lastArgs);
}

function runTokenTest(expected, source) {
  var elements = myjs.tokenize(source, DEFAULT_SETTINGS);
  var tokens = [];
  elements.forEach(function (element) {
    if (!element.isSoft()) {
      if (element.type != element.value) {
        tokens.push(element.type + ":" + element.value);
      } else {
        tokens.push(element.value);
      }
    }
  });
  assertListEquals(expected, tokens);
}

function testTokenizing() {
  runTokenTest(["=", "==", "===", "===", "="], "= == === ====");
  runTokenTest([">", ">>", ">>", ">", ">>", ">>"], "> >> >>> >>>>");
  runTokenTest(["<", "<<", "<<", "<", "<<", "<<"], "< << <<< <<<<");

  runTokenTest(["Identifier:f", "Identifier:fo", "for", "Identifier:fork"],
    "f fo for fork");
  runTokenTest(["NumericLiteral:0", "NumericLiteral:10", "NumericLiteral:2343"],
    "0 10 2343");
  runTokenTest(["(", "[", ",", ";", "]", ")"], "([,;])");
}

function testJsSyntax() {
  var syntax = myjs.getDialect('default');
  assertTrue(syntax.getGrammar().isValid());
}

function testLint() {
  var options = {
    sloppy: true,
    indent: 2,
    undef: true,
    vars: true,
    eqeq: true,
    plusplus: true
  };
  [tedir, myjs, myjs.mimetype, myjs.ast].forEach(function (module) {
    var source = module.getSource();
    var offset = Number(/offset: (\d+)/.exec(source)[1]);
    if (!JSLINT(source, options)) {
      JSLINT.errors.forEach(function (error) {
        if (error) {
          var line = error.line + offset;
          log("Lint(" + line + ")" + ": " + error.reason, "red");
        }
      });
    }
  });
}
