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

'use strict';

goog.provide('myjs.mimetype');

goog.require('myjs');

/**
 * @constructor
 */
myjs.mimetype.Error = function(message) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, myjs.mimetype.Error);
  }
  this.message = message;
};

myjs.mimetype.Error.prototype.toString = function() {
  return 'MyJsException: ' + this.message;
};

/**
 * Fetches a file using XHR, invoking the callback with the result when
 * the request is complete.
 *
 * @suppress {missingProperties}
 */
myjs.mimetype.fetch = function(url, callback) {
  var Constructor = window.ActiveXObject || XMLHttpRequest;
  var request = new Constructor('Microsoft.XMLHTTP');
  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      if (request.status == 0 || request.status == 200) {
        callback(request.responseText);
      } else {
        throw new Error('Could not load ' + url);
      }
    }
  };
  request.open('GET', url, false);
  request.send();
};

/**
 * @private
 */
myjs.mimetype.fileCache_ = {};
/**
 * Similar to fetch but uses a cache to avoid fetching the same file more
 * than once.
 */
myjs.mimetype.getFile = function(url, callback) {
  var cache = myjs.mimetype.fileCache_;
  if (cache.hasOwnProperty(url)) {
    callback(cache[url]);
  } else {
    myjs.mimetype.fetch(url, function(value) {
      cache[url] = value;
      callback(value);
    });
  }
};

/**
 * Loads the given source code string using the given dialect.
 */
myjs.mimetype.processSource = function(dialect, source, origin) {
  var result = dialect.translate(source, origin);
  console.log(result);
  window.eval(result);
};

/**
 * Processes the source code of the given script tag using the given
 * dialect.
 */
myjs.mimetype.processScriptWithDialect = function(dialect, script) {
  function processInnerText() {
    if (script.innerText) {
      myjs.mimetype.processSource(dialect, script.innerText.trim(), null);
    }
  }
  if (script.src) {
    // Load a remote src if there is one.
    myjs.mimetype.getFile(script.src, function(source) {
      var origin = new myjs.tedir.SourceOrigin(script.src);
      myjs.mimetype.processSource(dialect, source, origin);
      processInnerText();
    });
  } else {
    // If there is no 'src' just process the text of the script tag.
    processInnerText();
  }
};

myjs.mimetype.resolveDialect = function(name) {
  if (!name) {
    return myjs.getDialect('myjs.JavaScript');
  }
  var result = myjs.getDialect(name);
  if (result) {
    return result;
  }
  var fragment = myjs.getFragment(name);
  if (fragment) {
    return new myjs.Dialect(name).addFragment(name);
  }
  throw new myjs.mimetype.Error("Unknown dialect '" + name + "'.");
};

/**
 * Process the script tag as appropriate.
 */
myjs.mimetype.processScript = function(script) {
  var dialect = myjs.mimetype.resolveDialect(script.getAttribute('dialect'));
  myjs.mimetype.processScriptWithDialect(dialect, script);
};

addEventListener('DOMContentLoaded', function() {
  var i, scripts = document.getElementsByTagName('script');
  for (i = 0; i < scripts.length; i++) {
    var script = scripts[i];
    if (script.type == 'text/myjs') {
      myjs.mimetype.processScript(script);
    }
  }
});
