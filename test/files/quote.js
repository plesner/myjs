'use myjs.Quote';

function main() {
  var x = #Expression(1 + 1);
  var y = #Statement(if (a < b) return 1;);
  var y = #Statement(while (1 < 2) break;);
  var y = #Statement{if (a < b) return 1;};
  var y = #Statement{while (1 < 2) break;};
}
