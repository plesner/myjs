"use strict";

function testDefined() {
  assertTrue(tedir);
  assertTrue(myjs);
}

function getExpressionSyntax() {
  var syntax = new tedir.Syntax();
  var f = tedir.factory;
  // <expr>
  //   -> <atom> +: "+"
  syntax.getRule("expr")
      .addProd(f.plus(f.nonterm("atom"), f.token("+")));

  // <atom>
  //   -> $number
  //   |  "(" <expr> ")"
  syntax.getRule("atom")
      .addProd(f.value("number"))
      .addProd(f.seq(f.token("("), f.nonterm("expr"), f.token(")")));

  return syntax;
}

/**
 * Given a syntax and a start production, returns a function that can be
 * called with the expected output and a source and that will test that
 * parsing it produces the expected value.
 */
function getParserTestRunner(syntax, start) {
  return function (expected, source) {
    var parser = new tedir.Parser(syntax);
    var tokens = myjs.tokenize(source);
    assertListEquals(expected, parser.parse(start, tokens));
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
    .addProd(f.token("for"))
    .addProd(f.value("function"))
    .addProd(f.ignore(f.value("[")));

  var run = getParserTestRunner(syntax, "start");
  run(null, "for");
  run("function", "function");
  run(null, "[");
}

function testErrors() {
  var run = getParserTestRunner(getExpressionSyntax(), "expr");
  try {
    run(null, "10 10 10");
    fail();
  } catch (e) {
    assertTrue(e instanceof tedir.SyntaxError);
  }
}

function runTokenTest(expected, source) {
  var elements = myjs.tokenize(source);
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
  runTokenTest(["=", "==", "==="], "= == ===");
  runTokenTest(["Identifier:f", "Identifier:fo", "for", "Identifier:fork"],
    "f fo for fork");
  runTokenTest(["number:0", "number:10", "number:2343"], "0 10 2343");
  runTokenTest(["(", "[", ",", ";", "]", ")"], "([,;])");
}

function testJsSyntax() {
  assertTrue(myjs.getStandardSyntax().asGrammar().isValid());
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
  [tedir, myjs, myjs.mimetype].forEach(function (module) {
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
