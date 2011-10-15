"use strict";

String.prototype.startsWith = function (substr) {
  if (this.length < substr.length) {
    return false;
  } else {
    return this.substring(0, substr.length) == substr;
  }
};

function assertEquals(a, b) {
  if (a != b) {
    failComparison(a, b);
  }
}

function assertTrue(value) {
  if (value) {
    return;
  } else {
    throw "assertTrue failed";
  }
}

function failComparison(a, b) {
  throw "Error: " + a + " != " + b;
}

function defer(thunk) {
  window.setTimeout(thunk, 50);
}

function deferredFor(from, to, thunk, onDone) {
  if (from == to) {
    if (onDone != null)
      onDone();
  } else {
    defer(function () {
      thunk(from);
      deferredFor(from + 1, to, thunk, onDone);
    });
  }
}

function runSingleTest(fun, name) {
  var div = document.createElement('div');
  div.innerText = name;
  div.style.color = "grey";
  document.body.appendChild(div);
  defer(function () {
    try {
      fun();
      div.style.color = "green";
    } catch (e) {
      div.style.color = "red";
      div.innerText += " (" + e + ")";
    }
  });
}

function log(message) {
  var div = document.createElement('div');
  div.innerText = message;
  document.body.appendChild(div);
}

function runTedirTests() {
  var tests = [];
  for (var prop in this) {
    if (String(prop).startsWith("test")) {
      tests.push(prop);
    }
  }
  deferredFor(0, tests.length, function (i) {
    var prop = tests[i];
    runSingleTest(window[prop], prop);
  });
}
