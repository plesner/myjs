var fs = require('fs');
var myjs = require('./my');

function main() {
  var dialect = myjs.getDialect("default");
  fs.readFile("test/tedir.my.js", "utf8", function (error, code) {
    console.log(dialect.parseSource(code));
  });
}

main();
