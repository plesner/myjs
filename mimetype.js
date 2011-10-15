(function () {
  var DEFAULT_DIALECT = "default.dialect";

  /**
   * Fetches a file using XHR, invoking the callback with the result when
   * the request is complete.
   */
  function fetch(url, callback) {
    var request = new (window.ActiveXObject || XMLHttpRequest)("Microsoft.XMLHTTP");
    request.onreadystatechange = function () {
      if (request.readyState == 4) {
        if (request.status == 0 || request.status == 200) {
          callback(request.responseText);
        } else {
          throw new Error("Could not load " + url)
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
    if (url in fileCache) {
      callback(fileCache[url]);
    } else {
      fetch(url, function (value) {
        fileCache[url] = value;
        callback(value);
      });
    }
  }
  
  var dialectCache = {};
  /**
   * Returns the dialect for the given url, using a cache to ensure that the
   * same dialect is only loaded once.
   */
  function getDialect(url, callback) {
    if (url in dialectCache) {
      callback(dialectCache[url]);
    } else {
      getFile(url, function (value) {
        var dialect = new Dialect(value);
        dialectCache[url] = dialect;
        callback(dialect);
      });
    }
  }
  
  /**
   * Loads the given source code string using the given dialect.
   */
  function processSource(dialect, source) {

  }
  
  /**
   * Processes the source code of the given script tag using the given
   * dialect.
   */
  function processScriptWithDialect(dialect, script) {
    function processText() {
      if (script.innerText) {
        processSource(dialect, script.innerText);
      }
    }
    if (script.src) {
      // Load a remote src if there is one.
      getFile(script.src, function (source) {
        processSource(dialect, source);
        processText();
      });
    } else {
      // If there is no 'src' just process the text of the script tag.
      processText();
    }
  }
  
  function Dialect(source) {
    this.syntax = (new Function(source))();
  }

  /**
   * Process the script tag as appropriate.
   */
  function processScript(script) {
    var name = script.getAttribute("dialect") || DEFAULT_DIALECT;
    getDialect(name, function (dialect) {
      processScriptWithDialect(dialect, script);
    });
  }

  addEventListener("DOMContentLoaded", function () {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.type == "text/tedir") {
        processScript(script);
      }
    }
  });
})();
