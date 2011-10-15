"use strict";

// Declare namespace
var myjs = myjs || (function defineMyJs(namespace) { // offset: 3

  namespace.getSource = function () {
    return String(defineMyJs);
  };

  return namespace;
})({});
