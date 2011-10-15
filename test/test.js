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

function testJsTokenizing() {
  log(tedir.tokenizeJavaScript("for (var i = 0; i < 10; i++) { }"));
}
