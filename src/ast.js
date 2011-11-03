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
 * @fileoverview Utilitied for working with JSON syntax trees for javascript
 * programs. The structure of the syntax trees is taken directly from the
 * mozilla parser api, http://developer.mozilla.org/en/SpiderMonkey/Parser_API,
 * but without any of the SpiderMonkey-specific extensions.
 */

'use strict';

goog.provide('myjs.ast');

goog.require('myjs.utils');

/**
 * A syntax tree node.
 *
 * @constructor
 */
myjs.ast.Node = function() {
  /**
   * A string representing the AST variant type.
   * @type {string}
   */
  this.type = null;
};

/**
 * A standard function element.
 *
 * @param {myjs.ast.Identifier} id the name of the function.
 * @param {Array.<myjs.ast.Identifier>} params the function's parameters.
 * @param {myjs.ast.BlockStatement} body the body of the function.
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.Function = function(id, params, body) {
  /**
   * The name of the function.
   * @type {myjs.ast.Identifier}
   */
  this.id = id;

  /**
   * This function's parameters.
   * @type {Array.<myjs.ast.Identifier>}
   */
  this.params = params;

  /**
   * The body of this function.
   * @type {myjs.ast.BlockStatement}
   */
  this.body = body;
};

/**
 * Any statement.
 *
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.Statement = function() { };

/**
 * Any expression.
 *
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.Expression = function() { };
