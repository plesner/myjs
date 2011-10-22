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
 * Test utilities.
 */

'use strict';

/**
 * Returns true if this string starts with the given substring.
 *
 * @param {String} substr the string to compare with.
 * @return {boolean} Does this string start with the given substr?
 */
String.prototype.startsWith = function(substr) {
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
    throw 'assertTrue failed';
  }
}

function assertFalse(value) {
  assertTrue(!value);
}

function failComparison(a, b) {
  throw 'Error: ' + a + ' != ' + b;
}

function defer(thunk) {
  window.setTimeout(thunk, 50);
}

function deferredFor(from, to, thunk, onDone) {
  if (from == to) {
    if (onDone != null)
      onDone();
  } else {
    defer(function() {
      thunk(from);
      deferredFor(from + 1, to, thunk, onDone);
    });
  }
}

var CATCH_ERRORS = true;

function runSingleTest(fun, name) {
  var div = document.createElement('div');
  div.innerText = name;
  div.style.color = 'grey';
  document.body.appendChild(div);
  defer(function() {
    if (CATCH_ERRORS) {
      try {
        fun();
        div.style.color = 'green';
      } catch (e) {
        div.style.color = 'red';
        div.innerText += ' (' + e + ')';
      }
    } else {
      fun();
    }
  });
}

function log(message, colorOpt) {
  var div = document.createElement('div');
  div.innerText = message;
  if (colorOpt) {
    div.style.color = colorOpt;
  }
  document.body.appendChild(div);
}

function compareLists(one, two) {
  if (one === two)
    return true;
  if (Array.isArray(one) != Array.isArray(two))
    return false;
  if (one.length != two.length)
    return false;
  for (var i = 0; i < one.length; i++) {
    var vOne = one[i];
    var vTwo = two[i];
    if (Array.isArray(vOne) && Array.isArray(vTwo)) {
      if (!compareLists(vOne, vTwo))
        return false;
    } else if (one[i] != two[i]) {
      return false;
    }
  }
  return true;
}

function assertListEquals(one, two) {
  if (!compareLists(one, two)) {
    failComparison(listToString(one), listToString(two));
  }
}

function listToString(obj) {
  if (Array.isArray(obj)) {
    return '[' + obj.map(listToString).join(', ') + ']';
  } else {
    return String(obj);
  }
}

function runTedirTests() {
  var tests = [];
  for (var prop in this) {
    if (String(prop).startsWith('test')) {
      tests.push(prop);
    }
  }
  deferredFor(0, tests.length, function(i) {
    var prop = tests[i];
    runSingleTest(window[prop], prop);
  });
}
