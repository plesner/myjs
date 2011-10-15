"use strict";

function testDefined() {
  assertTrue(tedir);
}

function testSyntax() {
  var syntax = new tedir.Syntax();
  var f = tedir.factory;
  // <expr> -> "(" <expr> ")"
  syntax.addRule("expr", f.seq(f.token("("), f.nonterm("expr"), f.token(")")));
  // <expr> -> <atom> +: "+"
  syntax.addRule("expr", f.plus(f.nonterm("atom"), f.token("+")));      
  // <expr> -> <number>
  syntax.addRule("atom", f.token("10"));
  
  var tokens = ["(", "10", "+", "10", "+", "10", ")"];
  var parser = new tedir.Parser(syntax);
  log(parser.parse("expr", tokens));
}
