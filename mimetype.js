"use strict";

myjs.mimetype = myjs.mimetype || (function defineMimetype(namespace) { // offset: 0

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
  function processSource(dialect, source) {
    var ast = dialect.parseSource(source);
    console.log(ast);
  }

  /**
   * Processes the source code of the given script tag using the given
   * dialect.
   */
  function processScriptWithDialect(dialect, script) {
    function processInnerText() {
      if (script.innerText) {
        processSource(dialect, script.innerText);
      }
    }
    if (script.src) {
      // Load a remote src if there is one.
      getFile(script.src, function (source) {
        processSource(dialect, source);
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
