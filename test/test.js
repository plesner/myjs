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
 * Tests of tedir and myjs.
 */

var myjs = require('../myjs-0.1-node.js');
var framework = require('./framework.js');

(function() {

'use strict';

var ignore = myjs.factory.ignore;
var keyword = myjs.factory.keyword;
var nonterm = myjs.factory.nonterm;
var plus = myjs.factory.plus;
var seq = myjs.factory.seq;
var star = myjs.factory.star;
var token = myjs.factory.token;
var value = myjs.factory.value;
var toArray = myjs.utils.toArray;

var assertTrue = framework.assertTrue;
var assertFalse = framework.assertFalse;
var assertEquals = framework.assertEquals;
var assertListEquals = framework.assertListEquals;

var allTests = [];
function registerTest(fun) {
  allTests.push(fun);
}

registerTest(testDefined);
function testDefined() {
  assertTrue(myjs);
  assertTrue(myjs.tedir);
}

registerTest(testTrie);
function testTrie() {
  var Trie = myjs.Trie_;
  var t = Trie.build(['a', 'ab', 'abc', 'abe']);
  var first = t.get('a');
  assertFalse(t.get('b'));
  assertFalse(first.get('a'));
  var second = first.get('b');
  assertFalse(second.get('a'));
  assertFalse(second.get('b'));
  var third = second.get('c');
  assertFalse(third.get('a'));
  assertFalse(third.get('e'));
  var fourth = second.get('e');
  assertFalse(fourth.get('a'));
  assertFalse(fourth.get('c'));
  assertFalse(fourth.get('e'));
}

function getExpressionSyntax() {
  var syntax = myjs.Syntax.create();

  // <expr>
  //   -> <atom> +: "+"
  syntax.getRule('expr')
      .addProd(plus(nonterm('atom'), token('+')));

  // <atom>
  //   -> $NumericLiteral
  //   |  "(" <expr> ")"
  syntax.getRule('atom')
      .addProd(value('NumericLiteral'))
      .addProd(token('('), nonterm('expr'), token(')'));

  return syntax;
}

/**
 * Given a syntax and a start production, returns a function that can be
 * called with the expected output and a source and that will test that
 * parsing it produces the expected value. If a function is passed as the
 * expected value we'll check that an error is thrown that is an instance
 * of that function.
 *
 * @param {myjs.Syntax} syntax the syntax to use.
 * @param {string="start"} startOpt the start production.
 * @return {function(string, string)} a test runner function.
 */
function getParserTestRunner(syntax, startOpt) {
  var start = startOpt || 'start';
  return function(expected, source) {
    var parser = new myjs.tedir.Parser(syntax);
    var tokens = myjs.getDialect('default').tokenize_(source);
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

function getFragmentParser(start) {
  var dialect = myjs.getDialect('default');
  var parser = new myjs.tedir.Parser(dialect.getSyntax_());
  return function(source) {
    var tokens = dialect.tokenize_(source);
    return parser.parse(start, tokens);
  };
}

registerTest(testSimpleExpressions);
function testSimpleExpressions() {
  var run = getParserTestRunner(getExpressionSyntax(), 'expr');
  run([10], '10');
  run([11, 12], '11 + 12');
  run([13, 14, 15], '13 + 14 + 15');
  run([[16, 17, 18]], '(16 + 17 + 18)');
  run([[19, [20, 21]]], '(19 + (20 + 21))');
  run([[[22, 23], [24, 25]]], '((22 + 23) + (24 + 25))');
}

registerTest(testTokenValues);
function testTokenValues() {
  var syntax = myjs.tedir.Syntax.create();

  syntax.getRule('start')
    .addProd(token('for'))
    .addProd(value('in'))
    .addProd(ignore(value('[')));

  var run = getParserTestRunner(syntax);
  run(null, 'for');
  run('in', 'in');
  run(null, '[');
}

registerTest(testSimpleErrors);
function testSimpleErrors() {
  var run = getParserTestRunner(getExpressionSyntax(), 'expr');
  run(myjs.tedir.SyntaxError, '10 10 10');
}

registerTest(testSequences);
function testSequences() {
  var syntax = myjs.tedir.Syntax.create();

  syntax.getRule('start')
    .addProd(token('?'), seq(token('for')))
    .addProd(token(','), seq(value('for')))
    .addProd(token('['), seq(value('for'), value('in')))
    .addProd(token(']'), seq(token('for'), value('in')))
    .addProd(token('('), seq(value('for'), token('in')))
    .addProd(token(')'), seq(token('for'), token('in')))
    .addProd(token('{'), seq(token('for'), token('in'), token('do')))
    .addProd(token('}'), seq(value('for'), token('in'), value('do')));

  var run = getParserTestRunner(syntax);
  run(null, '? for');
  run('for', ', for');
  run(['for', 'in'], '[ for in');
  run('in', '] for in');
  run('for', '( for in');
  run(null, ') for in');
  run(['for', 'do'], '} for in do');
}

registerTest(testNestedSequences);
function testNestedSequences() {
  var syntax = myjs.tedir.Syntax.create();

  syntax.getRule('start')
    .addProd(token('?'), seq(value('for'), seq(value('in'), value('do'))))
    .addProd(token(','), seq(value('for'), seq(token('in'), value('do'))))
    .addProd(token('['), seq(value('for'), seq(token('in'), token('do'))));

  var run = getParserTestRunner(syntax);
  run(['for', ['in', 'do']], '? for in do');
  run(['for', 'do'], ', for in do');
  run('for', '[ for in do');
}

registerTest(testRepeatValues);
function testRepeatValues() {
  var syntax = myjs.tedir.Syntax.create();

  syntax.getRule('start')
    .addProd(token('['), star(value('for'), value('in')))
    .addProd(token(']'), star(token('for'), value('in')))
    .addProd(token('('), star(value('for'), token('in')))
    .addProd(token(')'), star(token('for'), token('in')));

  var run = getParserTestRunner(syntax);
  run([], '[');
  run(['for'], '[ for');
  run(['for', 'in', 'for'], '[ for in for');
  run(['for', 'in', 'for', 'in', 'for'], '[ for in for in for');
  run(myjs.tedir.SyntaxError, '[ for in');

  run([], ']');
  run([], '] for');
  run(['in'], '] for in for');
  run(['in', 'in'], '] for in for in for');
  run(myjs.tedir.SyntaxError, '] for in');

  run([], '(');
  run(['for'], '( for');
  run(['for', 'for'], '( for in for');
  run(['for', 'for', 'for'], '( for in for in for');
  run(myjs.tedir.SyntaxError, '( for in');

  run([], ')');
  run([], ') for');
  run([], ') for in for');
  run([], ') for in for in for');
  run(myjs.tedir.SyntaxError, ') for in');
}

registerTest(testInvoker);
function testInvoker() {
  var Invoker = myjs.tedir.Invoker_;
  var lastArgs; // The last args passed to a constructor.

  // 0
  var zeroCall = Invoker.forArity(0, false, function() {
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
  var oneCall = Invoker.forArity(1, false, function(arg) {
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
  var twoCall = Invoker.forArity(2, false, function(arg1, arg2) {
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
  var elements = myjs.getDialect('default').tokenize_(source);
  var tokens = [];
  elements.forEach(function(element) {
    if (!element.isSoft()) {
      if (element.type != element.value) {
        tokens.push(element.type + ':' + element.value);
      } else {
        tokens.push(element.value);
      }
    }
  });
  assertListEquals(expected, tokens);
}

registerTest(testTokenizing);
function testTokenizing() {
  runTokenTest(['=', '==', '===', '===', '='], '= == === ====');
  runTokenTest(['!', '!=', '!==', '!==', '=', '!==', '=='],
    '! != !== !=== !====');
  runTokenTest(['>', '>>', '>>>', '>>>', '>'], '> >> >>> >>>>');
  runTokenTest(['<', '<<', '<<', '<', '<<', '<<'], '< << <<< <<<<');
  runTokenTest(['>', '>=', '>>=', '>>>=', '>>>', '>='], '> >= >>= >>>= >>>>=');
  runTokenTest(['<', '<<', '<<', '<', '<<', '<<'], '< << <<< <<<<');
  runTokenTest(['<', '<=', '<<=', '<<', '<=', '<<', '<<='],
    '< <= <<= <<<= <<<<=');
  runTokenTest(['|', '||', '||', '|', '||', '||'], '| || ||| ||||');
  runTokenTest(['|', '||', '|=', '||', '='], '| || |= ||=');
  runTokenTest(['&', '&&', '&&', '&', '&&', '&&'], '& && &&& &&&&');
  runTokenTest(['&', '&&', '&=', '&&', '='], '& && &= &&=');
  runTokenTest(['+', '++', '++', '+', '++', '++'], '+ ++ +++ ++++');
  runTokenTest(['+', '+=', '++', '=', '++', '+='], '+ += ++= +++=');
  runTokenTest(['-', '--', '--', '-', '--', '--'], '- -- --- ----');
  runTokenTest(['-', '-=', '--', '=', '--', '-='], '- -= --= ---=');
  runTokenTest(['*', '*', '*', '*=', '*', '*='], '* ** *= **=');
  runTokenTest(['%', '%', '%', '%=', '%', '%='], '% %% %= %%=');
  runTokenTest(['^', '^', '^', '^=', '^', '^='], '^ ^^ ^= ^^=');
  runTokenTest(['/', '/=', '/=', '='], '/ /= /==');

  runTokenTest(['Identifier:toString'], 'toString');

  runTokenTest(['Identifier:f', 'Identifier:fo', 'for', 'Identifier:fork'],
    'f fo for fork');
  runTokenTest(['NumericLiteral:0', 'NumericLiteral:10', 'NumericLiteral:2343'],
    '0 10 2343');
  runTokenTest(['(', '[', ',', ';', ']', ')', '.'], '([,;]).');
}

function alphaJson(obj) {
  if (Array.isArray(obj)) {
    return '[' + obj.map(alphaJson).join(',') + ']';
  } else if (!obj || typeof obj != 'object') {
    return JSON.stringify(obj);
  } else if (typeof obj == 'object') {
    var parts = Object.keys(obj).sort().map(function(key) {
      return alphaJson(key) + ':' + alphaJson(obj[key]);
    });
    return '{' + parts.join(',') + '}';
  }
}

var exprParser = getFragmentParser('Expression');
function exprCheck(source, expected) {
  assertEquals(alphaJson(exprParser(source)), alphaJson(expected));
}

function lit(value) {
  return {type: 'Literal', value: value};
}

function arr(var_args) {
  return {type: 'ArrayExpression', elements: toArray(arguments)};
}

function obj(var_args) {
  return {type: 'ObjectExpression', properties: toArray(arguments)};
}

function prop(key, value) {
  return {type: 'ObjectProperty', key: key, value: value};
}

function id(name) {
  return {type: 'Identifier', name: name};
}

function ths() {
  return {type: 'ThisExpression'};
}

function upd(op, arg, pre) {
  var opAst = {type: 'UpdateOperator', token: op};
  return {type: 'UpdateExpression', operator: opAst, argument: arg,
    prefix: pre};
}

function log(left, op, right) {
  var opAst = {type: 'LogicalOperator', token: op};
  return {type: 'LogicalExpression', operator: opAst, left: left, right: right};
}

function cond(test, cons, alt) {
  return {type: 'ConditionalExpression', test: test, consequent: cons,
    alternate: alt};
}

function ury(op, arg, pre) {
  var opAst = {type: 'UnaryOperator', token: op};
  return {type: 'UnaryExpression', operator: opAst, prefix: pre,
    argument: arg};
}

function bin(left, op, right) {
  var opAst = {type: 'BinaryOperator', token: op};
  return {type: 'BinaryExpression', operator: opAst, left: left,
    right: right};
}

function ass(left, op, right) {
  var opAst = {type: 'AssignmentOperator', token: op};
  return {type: 'AssignmentExpression', operator: opAst, left: left,
    right: right};
}

function preu(op, arg) {
  return upd(op, arg, true);
}

function posu(arg, op) {
  return upd(op, arg, false);
}

function call(fun, var_args) {
  return {type: 'CallExpression', callee: fun,
    arguments: toArray(arguments, 1)};
}

function nw(cons, var_args) {
  return {type: 'NewExpression', constructor: cons,
    arguments: toArray(arguments, 1)};
}

function get(obj, prop) {
  return {type: 'MemberExpression', object: obj, property: id(prop),
    computed: false};
}

function mem(obj, prop) {
  return {type: 'MemberExpression', object: obj, property: prop,
    computed: true};
}

function gfun(type, name, params, body) {
  return {type: type, id: name || null, params: params.map(id), body: body};
}

function fun(name, params, body) {
  return gfun('FunctionExpression', name, params, body);
}

registerTest(testLiteralParsing);
function testLiteralParsing() {
  exprCheck('1', lit(1));
  exprCheck('true', lit(true));
  exprCheck('false', lit(false));
  exprCheck("'foo'", lit('foo'));
  exprCheck('\"foo\"', lit('foo'));
  exprCheck('[1, 2, 3]', arr(lit(1), lit(2), lit(3)));
  exprCheck('[1]', arr(lit(1)));
  exprCheck('[]', arr());
  exprCheck('{}', obj());
  exprCheck('{foo: 1}', obj(
    prop(id('foo'), lit(1))));
  exprCheck('{foo: 1, bar: 2}', obj(
    prop(id('foo'), lit(1)),
    prop(id('bar'), lit(2))));
}

registerTest(testSimpleExpressionParsing);
function testSimpleExpressionParsing() {
  exprCheck('this', ths());
  exprCheck('foo', id('foo'));
  exprCheck('(foo)', id('foo'));
}

registerTest(testUpdateExpressionParsing);
function testUpdateExpressionParsing() {
  exprCheck('++a', preu('++', id('a')));
  exprCheck('++ ++ a', preu('++', preu('++', id('a'))));
  exprCheck('++ -- a', preu('++', preu('--', id('a'))));
  exprCheck('-- ++ a', preu('--', preu('++', id('a'))));
  exprCheck('a++', posu(id('a'), '++'));
  exprCheck('a ++ ++', posu(posu(id('a'), '++'), '++'));
  exprCheck('a ++ --', posu(posu(id('a'), '++'), '--'));
  exprCheck('a -- ++', posu(posu(id('a'), '--'), '++'));
  // Postfix binds tighter than prefix.
  exprCheck('++a--', preu('++', posu(id('a'), '--')));
  exprCheck('--++a--++', preu('--', preu('++',
    posu(posu(id('a'), '--'), '++'))));
}

registerTest(testLogicalExpressionParsing);
function testLogicalExpressionParsing() {
  exprCheck('true || false', log(lit(true), '||', lit(false)));
  exprCheck('true && false', log(lit(true), '&&', lit(false)));
}

registerTest(testConditionalExpressionParsing);
function testConditionalExpressionParsing() {
  exprCheck('a ? b : c', cond(id('a'), id('b'), id('c')));
}

registerTest(testUnaryExpressionParsing);
function testUnaryExpressionParsing() {
  exprCheck('!a', ury('!', id('a'), true));
  exprCheck('-a', ury('-', id('a'), true));
  exprCheck('~a', ury('~', id('a'), true));
  exprCheck('+a', ury('+', id('a'), true));
  exprCheck('typeof a', ury('typeof', id('a'), true));
  exprCheck('void a', ury('void', id('a'), true));
  exprCheck('delete a', ury('delete', id('a'), true));
}

registerTest(testBinaryExpressionParsing);
function testBinaryExpressionParsing() {
  exprCheck('a==b', bin(id('a'), '==', id('b')));
  exprCheck('a!=b', bin(id('a'), '!=', id('b')));
  exprCheck('a===b', bin(id('a'), '===', id('b')));
  exprCheck('a!==b', bin(id('a'), '!==', id('b')));
  exprCheck('a<b', bin(id('a'), '<', id('b')));
  exprCheck('a<=b', bin(id('a'), '<=', id('b')));
  exprCheck('a>b', bin(id('a'), '>', id('b')));
  exprCheck('a>=b', bin(id('a'), '>=', id('b')));
  exprCheck('a<<b', bin(id('a'), '<<', id('b')));
  exprCheck('a>>b', bin(id('a'), '>>', id('b')));
  exprCheck('a>>>b', bin(id('a'), '>>>', id('b')));
  exprCheck('a+b', bin(id('a'), '+', id('b')));
  exprCheck('a-b', bin(id('a'), '-', id('b')));
  exprCheck('a*b', bin(id('a'), '*', id('b')));
  exprCheck('a/b', bin(id('a'), '/', id('b')));
  exprCheck('a%b', bin(id('a'), '%', id('b')));
  exprCheck('a|b', bin(id('a'), '|', id('b')));
  exprCheck('a^b', bin(id('a'), '^', id('b')));
  exprCheck('a instanceof b', bin(id('a'), 'instanceof', id('b')));
  exprCheck('a in b', bin(id('a'), 'in', id('b')));
}

registerTest(testAssignmentExpressionParsing);
function testAssignmentExpressionParsing() {
  exprCheck('a=b', ass(id('a'), '=', id('b')));
  exprCheck('a+=b', ass(id('a'), '+=', id('b')));
  exprCheck('a-=b', ass(id('a'), '-=', id('b')));
  exprCheck('a*=b', ass(id('a'), '*=', id('b')));
  exprCheck('a/=b', ass(id('a'), '/=', id('b')));
  exprCheck('a%=b', ass(id('a'), '%=', id('b')));
  exprCheck('a<<=b', ass(id('a'), '<<=', id('b')));
  exprCheck('a>>=b', ass(id('a'), '>>=', id('b')));
  exprCheck('a>>>=b', ass(id('a'), '>>>=', id('b')));
  exprCheck('a|=b', ass(id('a'), '|=', id('b')));
  exprCheck('a^=b', ass(id('a'), '^=', id('b')));
  exprCheck('a&=b', ass(id('a'), '&=', id('b')));
}

registerTest(testCallExpressionParsing);
function testCallExpressionParsing() {
  exprCheck('a()', call(id('a')));
  exprCheck('a(1)', call(id('a'), lit(1)));
  exprCheck('a(1, 2)', call(id('a'), lit(1), lit(2)));
  exprCheck('a(1, 2, 3)', call(id('a'), lit(1), lit(2), lit(3)));
  exprCheck('a(1)(2)(3)', call(call(call(id('a'), lit(1)), lit(2)), lit(3)));
}

registerTest(testMemberExpressionParsing);
function testMemberExpressionParsing() {
  exprCheck('a.b', get(id('a'), 'b'));
  exprCheck('c.d.e', get(get(id('c'), 'd'), 'e'));
  exprCheck('a[4]', mem(id('a'), lit(4)));
  exprCheck('a[5][6]', mem(mem(id('a'), lit(5)), lit(6)));
  exprCheck('x.y[7].z[8]', mem(get(mem(get(id('x'), 'y'), lit(7)), 'z'),
    lit(8)));
}

registerTest(testNewExpressionParsing);
function testNewExpressionParsing() {
  exprCheck('new A', nw(id('A')));
  exprCheck('new A()', nw(id('A')));
  exprCheck('new A(1)', nw(id('A'), lit(1)));
  exprCheck('new A(1, 2)', nw(id('A'), lit(1), lit(2)));
  exprCheck('new a.b(1, 2)', nw(get(id('a'), 'b'), lit(1), lit(2)));
  exprCheck('new new A', nw(nw(id('A'))));
  exprCheck('new new A(4)(5)', nw(nw(id('A'), lit(4)), lit(5)));
}

registerTest(testFunctionExpressionParsing);
function testFunctionExpressionParsing() {
  exprCheck('function () { }', fun(null, [], bck()));
  exprCheck('function (a) { }', fun(null, ['a'], bck()));
  exprCheck('function (a, b) { }', fun(null, ['a', 'b'], bck()));
  exprCheck('function (a, b, c) { }', fun(null, ['a', 'b', 'c'], bck()));
  exprCheck('function yutz(a, b, c) { }', fun(id('yutz'), ['a', 'b', 'c'],
    bck()));
}

var stmtParser = getFragmentParser('Statement');
function stmtCheck(source, expected) {
  assertEquals(alphaJson(stmtParser(source)), alphaJson(expected));
}

function exp(expr) {
  return {type: 'ExpressionStatement', expression: expr};
}

function bck(var_args) {
  return {type: 'BlockStatement', body: toArray(arguments)};
}

function ift(test, cons, alt) {
  return {type: 'IfStatement', test: test, consequent: cons,
    alternate: (alt || null)};
}

function brk(lab) {
  return {type: 'BreakStatement', label: lab ? id(lab) : null};
}

function cnt(lab) {
  return {type: 'ContinueStatement', label: lab ? id(lab) : null};
}

function ret(value) {
  return {type: 'ReturnStatement', argument: value || null};
}

function thr(value) {
  return {type: 'ThrowStatement', argument: value};
}

function ty(block, handler, fin) {
  return {type: 'TryStatement', block: block, handler: handler,
    finalizer: fin || null};
}

function cth(param, body) {
  return {type: 'CatchClause', param: id(param), body: body};
}

function whl(test, body) {
  return {type: 'WhileStatement', test: test, body: body};
}

function dow(body, test) {
  return {type: 'DoWhileStatement', test: test, body: body};
}

function fr(init, test, update, body) {
  return {type: 'ForStatement', init: init || null, test: test || null,
    update: update || null, body: body};
}

function fin(left, right, body) {
  return {type: 'ForInStatement', left: left, right: right, body: body};
}

function swc(disc, var_args) {
  return {type: 'SwitchStatement', discriminant: disc,
    cases: toArray(arguments, 1)};
}

function cse(test, var_args) {
  return {type: 'SwitchCase', test: test, consequent: toArray(arguments, 1)};
}

function vas(decls) {
  return {type: 'VariableDeclaration', declarations: toArray(arguments)};
}

function vdc(name, init) {
  return {type: 'VariableDeclarator', id: id(name), init: init || null};
}

registerTest(testExpressionStatementParsing);
function testExpressionStatementParsing() {
  stmtCheck('1;', exp(lit(1)));
  stmtCheck('1 + 2;', exp(bin(lit(1), '+', lit(2))));
}

registerTest(testBlockStatementParsing);
function testBlockStatementParsing() {
  stmtCheck('{}', bck());
  stmtCheck('{1;}', bck(exp(lit(1))));
  stmtCheck('{1; 2;}', bck(exp(lit(1)), exp(lit(2))));
}

registerTest(testIfStatementParsing);
function testIfStatementParsing() {
  stmtCheck('if (1) 2; else 3;', ift(lit(1), exp(lit(2)), exp(lit(3))));
  stmtCheck('if (1) 2;', ift(lit(1), exp(lit(2))));
}

registerTest(testTryStatementParsing);
function testTryStatementParsing() {
  stmtCheck('try {} catch (a) {}', ty(bck(), cth('a', bck())));
  stmtCheck('try {1;} catch (a) {2;}', ty(bck(exp(lit(1))), cth('a',
    bck(exp(lit(2))))));
  stmtCheck('try {} finally {}', ty(bck(), null, bck()));
  stmtCheck('try {3;} finally {4;}', ty(bck(exp(lit(3))), null,
    bck(exp(lit(4)))));
  stmtCheck('try {} catch (a) {} finally {}', ty(bck(), cth('a', bck()),
    bck()));
}

registerTest(testSimpleStatementParsing);
function testSimpleStatementParsing() {
  stmtCheck('break;', brk());
  stmtCheck('break foo;', brk('foo'));
  stmtCheck('continue;', cnt());
  stmtCheck('continue foo;', cnt('foo'));
  stmtCheck('return;', ret());
  stmtCheck('return foo;', ret(id('foo')));
  stmtCheck('return 4;', ret(lit(4)));
  stmtCheck('throw foo;', thr(id('foo')));
  stmtCheck('throw 4;', thr(lit(4)));
}

registerTest(testWhileStatementParsing);
function testWhileStatementParsing() {
  stmtCheck('while (a) b;', whl(id('a'), exp(id('b'))));
  stmtCheck('do a; while (b);', dow(exp(id('a')), id('b')));
}

registerTest(testForStatementParsing);
function testForStatementParsing() {
  // Three-clause
  stmtCheck('for (;;) x;', fr(null, null, null, exp(id('x'))));
  stmtCheck('for (1;;) x;', fr(lit(1), null, null, exp(id('x'))));
  stmtCheck('for (;1;) x;', fr(null, lit(1), null, exp(id('x'))));
  stmtCheck('for (;;1) x;', fr(null, null, lit(1), exp(id('x'))));
  stmtCheck('for (1;2;3) x;', fr(lit(1), lit(2), lit(3), exp(id('x'))));
  stmtCheck('for (x;true;) x;', fr(id('x'), lit(true), null, exp(id('x'))));
  stmtCheck('for (var x;true;) x;', fr(vas(vdc('x')), lit(true), null,
    exp(id('x'))));
  stmtCheck('for (var x, y;true;) x;', fr(vas(vdc('x'), vdc('y')), lit(true),
    null, exp(id('x'))));
  // For-in
  stmtCheck('for (x in y) s;', fin(id('x'), id('y'), exp(id('s'))));
  stmtCheck('for (var x in y) s;', fin(vdc('x'), id('y'), exp(id('s'))));
  stmtCheck('for (x.y in y) s;', fin(get(id('x'), 'y'), id('y'), exp(id('s'))));
}

registerTest(testSwitchStatementParsing);
function testSwitchStatementParsing() {
  stmtCheck('switch (x) { }', swc(id('x')));
  stmtCheck('switch (x) { case 1: break; }', swc(id('x'), cse(lit(1), brk())));
  stmtCheck('switch (x) { case 1: 4; 3; }', swc(id('x'), cse(lit(1),
    exp(lit(4)), exp(lit(3)))));
  stmtCheck('switch (x) { case 1: break; case 2: continue; }', swc(id('x'),
    cse(lit(1), brk()), cse(lit(2), cnt())));
  stmtCheck('switch (x) { case 1: break; default: continue; }', swc(id('x'),
    cse(lit(1), brk()), cse(null, cnt())));
  stmtCheck('switch (x) { default: continue; }', swc(id('x'),
    cse(null, cnt())));
}

registerTest(testVariableStatementParsing);
function testVariableStatementParsing() {
  stmtCheck('var i = 0;', vas(vdc('i', lit(0))));
  stmtCheck('var i;', vas(vdc('i')));
  stmtCheck('var i, j;', vas(vdc('i'), vdc('j')));
  stmtCheck('var i, j, k;', vas(vdc('i'), vdc('j'), vdc('k')));
  stmtCheck('var i = 0, j, k;', vas(vdc('i', lit(0)), vdc('j'), vdc('k')));
  stmtCheck('var i, j = 1, k;', vas(vdc('i'), vdc('j', lit(1)), vdc('k')));
  stmtCheck('var i, j, k = 2;', vas(vdc('i'), vdc('j'), vdc('k', lit(2))));
}

var elmParser = getFragmentParser('SourceElement');
function elmCheck(source, expected) {
  assertEquals(alphaJson(elmParser(source)), alphaJson(expected));
}

function fdc(name, params, body) {
  return gfun('FunctionDeclaration', name, params, body);
}

registerTest(testSourceElementParsing);
function testSourceElementParsing() {
  elmCheck('function foo() { }', fdc(id('foo'), [], bck()));
  elmCheck('function foo(a) { }', fdc(id('foo'), ['a'], bck()));
  elmCheck('function foo(a, b) { }', fdc(id('foo'), ['a', 'b'], bck()));
}

var progParser = getFragmentParser('Program');
function progCheck(source, expected) {
  assertEquals(alphaJson(progParser(source)), alphaJson(expected));
}

function prg(var_args) {
  return {type: 'Program', elements: toArray(arguments)};
}

registerTest(testProgramParsing);
function testProgramParsing() {
  progCheck('function foo() { }', prg(fdc(id('foo'), [], bck())));
  progCheck('var x = 0;', prg(vas(vdc('x', lit(0)))));
}

module.exports.getAllTests = function() {
  return allTests;
};

})();
