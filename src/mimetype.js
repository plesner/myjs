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
 * Implementation of the "text/myjs" script type.
 */

"use strict";

myjs.nolint = myjs.nolint || (function (namespace) {

  namespace.execute = function (text) {
    window.eval(text);
  };

  return namespace;

})({});

var mimetype = mimetype || (function defineMimetype(namespace) { // offset: 20

  /**
   * Signals an error condition in myjs.
   */
  function MyJsException(message) {
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MyJsException);
    }
    this.message = message;
  }

  MyJsException.prototype.toString = function () {
    return "MyJsException: " + this.message;
  };

  var DEFAULT_DIALECT = "default";

  /**
   * Fetches a file using XHR, invoking the callback with the result when
   * the request is complete.
   */
  function fetch(url, callback) {
    var Constructor = window.ActiveXObject || XMLHttpRequest;
    var request = new Constructor("Microsoft.XMLHTTP");
    request.onreadystatechange = function () {
      if (request.readyState == 4) {
        if (request.status == 0 || request.status == 200) {
          callback(request.responseText);
        } else {
          throw new Error("Could not load " + url);
        }
      }
    };
    request.open("GET", url, false);
    request.send();
  }

  var fileCache = {};
  /**
   * Similar to fetch but uses a cache to avoid fetching the same file more
   * than once.
   */
  function getFile(url, callback) {
    if (fileCache.hasOwnProperty(url)) {
      callback(fileCache[url]);
    } else {
      fetch(url, function (value) {
        fileCache[url] = value;
        callback(value);
      });
    }
  }

  /**
   * Loads the given source code string using the given dialect.
   */
  function processSource(dialect, source, origin, traceTarget) {
    var result = dialect.translate(source, origin, !!traceTarget);
    if (traceTarget) {
      (window[traceTarget])(result);
    } else {
      console.log(result);
      myjs.nolint.execute(result);
    }
  }

  /**
   * Processes the source code of the given script tag using the given
   * dialect.
   */
  function processScriptWithDialect(dialect, script) {
    var traceTarget = script.getAttribute("onTrace");
    function processInnerText() {
      if (script.innerText) {
        processSource(dialect, script.innerText.trim(), null, traceTarget);
      }
    }
    if (script.src) {
      // Load a remote src if there is one.
      getFile(script.src, function (source) {
        var origin = new tedir.SourceOrigin(script.src);
        processSource(dialect, source, origin, traceTarget);
        processInnerText();
      });
    } else {
      // If there is no 'src' just process the text of the script tag.
      processInnerText();
    }
  }

  /**
   * Process the script tag as appropriate.
   */
  function processScript(script) {
    var name = script.getAttribute("dialect") || DEFAULT_DIALECT;
    var dialect = myjs.getDialect(name);
    if (!dialect) {
      throw new MyJsException("Unknown dialect '" + name + "'.");
    }
    processScriptWithDialect(dialect, script);
  }

  addEventListener("DOMContentLoaded", function () {
    var i, scripts = document.getElementsByTagName("script");
    for (i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.type == "text/myjs") {
        processScript(script);
      }
    }
  });

  namespace.getSource = function () {
    return String(defineMimetype);
  };

  return namespace;
})({});
