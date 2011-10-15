"use strict";

function testDefined() {
  assertTrue(tedir);
}

function getExpressionSyntax() {
  var syntax = new tedir.Syntax();
  var f = tedir.factory;
  // <expr>
  //   -> <atom> +: "+"
  syntax.toRule("expr")
      .addProd(f.plus(f.nonterm("atom"), f.token("+")));

  // <atom>
  //   -> $number
  //   |  "(" <expr> ")"
  syntax.toRule("atom")
      .addProd(f.token("number"))
      .addProd(f.seq(f.token("("), f.nonterm("expr"), f.token(")")));

  return syntax;
}

var EXPR = getExpressionSyntax();

function runParserTest(expected, source) {
  var parser = new tedir.Parser(EXPR);
  var tokens = tedir.tokenizeJavaScript(source);
  assertListEquals(expected, parser.parse("expr", tokens));
}

function testSyntax() {
  runParserTest([10], "10");
  runParserTest([11, 12], "11 + 12");
  runParserTest([13, 14, 15], "13 + 14 + 15");
  runParserTest([[16, 17, 18]], "(16 + 17 + 18)");  
  runParserTest([[19, [20, 21]]], "(19 + (20 + 21))");  
  runParserTest([[[22, 23], [24, 25]]], "((22 + 23) + (24 + 25))");  
}

function runTokenTest(expected, source) {
  var elements = tedir.tokenizeJavaScript(source);
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
  runTokenTest(["ident:f", "ident:fo", "for", "ident:fork"], "f fo for fork");
  runTokenTest(["number:0", "number:10", "number:2343"], "0 10 2343");
  runTokenTest(["(", "[", ",", ";", "]", ")"], "([,;])");
}

function testJsSyntax() {
  log(tedir.getJavaScriptSyntax());
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
  if (!JSLINT(tedir.getSource(), options)) {
    JSLINT.errors.forEach(function (error) {
      if (error) {
        log((error.line + 3) + ": " + error.reason, "red");
      }
    });
  }
}
