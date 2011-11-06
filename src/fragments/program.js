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
  this['type'] = 'Program';

  /**
   * The program elements.
   * @type {Array}
   */
  this['elements'] = body;
};

/**
 * @inheritDoc
 */
myjs.ast.Program.prototype.unparse = function(context) {
  context.nodes(this['elements']);
};

(function() {

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

    // <FunctionBody>
    //   -> <SourceElement>*
    syntax.getRule('FunctionBody')
      .addProd(f.star(f.nonterm('SourceElement')))
      .setConstructor(myjs.ast.BlockStatement);

    /**
     * Custom expression used to parse optional semicolons.
     *
     * @constructor
     * @extends myjs.tedir.CustomHandler
     */
    function AutoSemiHandler() { }
    goog.inherits(AutoSemiHandler, myjs.tedir.CustomHandler);

    AutoSemiHandler.prototype.parse = function(context) {
      var input = context.getTokenStream();
      var current = input.getCurrent();
      if (current.value == ';') {
        // If we're at a semicolon advance over it to the next hard token
        // and return success.
        input.advanceHard();
        return null;
      } else if (current.value == '}') {
        // Otherwise if we're at a } that counts so we return success.
        return null;
      } else {
        // Else we need to rewind past the leading ether and look for a
        // newline.
        input.rewindEther();
        current = input.getCurrent();
        while (current.isSoft()) {
          if (current.value.indexOf('\n') != -1) {
            // Found a piece of ether containing a newline. Skip back to
            // where we started and return success.
            input.advanceHard();
            return null;
          } else {
            // Otherwise we continue skipping forward.
            input.advanceSoft();
            current = input.getCurrent();
          }
        }
        // Found no soft token containing a newline. Fail.
        return context.getErrorMarker();
      }
    };

    // <AutoSemi>
    //   -> ";"
    syntax.getRule('AutoSemi')
      .addProd(f.custom(new AutoSemiHandler()));

    return syntax;
  }

  var fragment = new myjs.Fragment('myjs.Program')
    .setSyntaxProvider(getSyntax)
    .registerType('Program', myjs.ast.Program);

  myjs.registerFragment(fragment);

})();
