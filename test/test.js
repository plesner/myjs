"use strict";

function testDefined() {
  assertTrue(tedir);
}

function getExpressionSyntax() {
  var syntax = new tedir.Syntax();
  var f = tedir.factory;
  // <expr>
  //   -> <atom> +: "+"
  syntax.addRule("expr", f.plus(f.nonterm("atom"), f.token("+")));

  // <atom>
  //   -> $number
  //   |  "(" <expr> ")"
  syntax.addRule("atom", f.token("10"));
  syntax.addRule("atom", f.seq(f.token("("), f.nonterm("expr"), f.token(")")));
  return syntax;
}

var EXPR = getExpressionSyntax();

function runParserTest(expected, source) {
  var parser = new tedir.Parser(EXPR);
  var tokens = source.split(" ");
  assertListEquals(expected, parser.parse("expr", tokens));
}

function testSyntax() {
  runParserTest([10], "10");
  runParserTest([10, 10], "10 + 10");
  runParserTest([10, 10, 10], "10 + 10 + 10");
  runParserTest([[10, 10, 10]], "( 10 + 10 + 10 )");  
  runParserTest([[10, [10, 10]]], "( 10 + ( 10 + 10 ) )");  
  runParserTest([[[10, 10], [10, 10]]], "( ( 10 + 10 ) + ( 10 + 10 ) )");  
}

function runTokenTest(expected, source) {
  var elements = tedir.tokenizeJavaScript(source);
  var tokens = [];
  elements.forEach(function (element) {
    if (!element.isEther()) {
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
