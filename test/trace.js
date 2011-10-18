// Copyright 2011 the MyJs project authors. All rights reserved.
//
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Utility for displaying a parse trace.
 */

function showTrace(trace) {
  var root = document.getElementById("trace");
  defer(function () {
    new TraceReplay(trace, root).start();
  });
}

function TraceReplay(trace, root) {
  this.trace = trace;
  this.nodes = [];
  this.root = root;
}

TraceReplay.prototype.addElements = function () {
  for (var i = 0; i < this.trace.tokens.length; i++) {
    var token = this.trace.tokens[i];
    var div = document.createElement("span");
    div.innerText = token.value;
    if (token.isSoft()) {
      div.className = "soft";
    } else {
      div.className = "plain";
    }
    this.root.appendChild(div);
    this.nodes[i] = div;
  }
};

TraceReplay.prototype.start = function () {
  this.addElements();
  this.replayTrace(0, 0);
};

TraceReplay.prototype.replayTrace = function (lastPos, step) {
  var steps = this.trace.steps;
  if (step == steps.length) {
    if (this.trace.isError()) {
      var error = this.trace.result;
      this.updateMarkers(error.tokenIndex, error.tokenIndex + 1, "error");
    }
  } else {
    var newPos = steps[step];
    if (lastPos < newPos) {
      this.updateMarkers(lastPos, newPos, "touched");
    } else if (newPos < lastPos) {
      this.updateMarkers(newPos, lastPos, "plain");
    }
    window.setTimeout(function () {
      this.replayTrace(newPos, step + 1);
    }.bind(this), 250);
  }
};

TraceReplay.prototype.updateMarkers = function (before, after, className) {
  for (var i = before; i < after; i++) {
    var token = this.trace.tokens[i];
    if (!token.isSoft()) {
      this.nodes[i].className = className;
    }
  }
};
