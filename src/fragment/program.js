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
 * @fileoverview Basic program structure.
 */

'use strict';

goog.require('myjs');
goog.require('myjs.ast');

/**
 * A standard Program element.
 *
 * @param {Array} body the program elements.
 * @constructor
 * @extends myjs.ast.Node
 */
myjs.ast.Program = function(body) {
  /**
   * "Program"
   * @const
   */
  this.type = 'Program';

  /**
   * The program elements.
   * @type {Array}
   */
  this.elements = body;
};

(function () {

  function ProgramHandler() { }

  ProgramHandler.prototype.unparse = function(context, node) {
    context.nodes(node.elements);
  };

  function getSyntax() {
    var syntax = myjs.Syntax.create();
    var f = myjs.factory;

    // <Program>
    //   -> <SourceElement>*
    syntax.getRule('Program')
      .addProd(f.star(f.nonterm('SourceElement')))
      .setConstructor(myjs.ast.Program);

    // <SourceElement>
    //   -> <FunctionDeclaration>
    //   -> <Statement>
    syntax.getRule('SourceElement')
      .addProd(f.nonterm('FunctionDeclaration'))
      .addProd(f.nonterm('Statement'));

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Program')
    .setSyntaxProvider(getSyntax)
    .addNodeHandler('Program', new ProgramHandler());

  myjs.registerFragment(fragment);

})();
