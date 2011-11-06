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

// Extra property exports.
goog.exportProperty(myjs.Trie_, 'build', myjs.Trie_.build);
goog.exportProperty(myjs.Trie_.prototype, 'get', myjs.Trie_.prototype.get);
goog.exportProperty(myjs.Dialect.prototype, 'getSyntax_',
    myjs.Dialect.prototype.getSyntax_);
goog.exportProperty(myjs.Dialect.prototype, 'tokenize_',
  myjs.Dialect.prototype.tokenize_);

// myjs
goog.exportProperty(module.exports, 'factory', {});
goog.exportProperty(module.exports['factory'], 'ignore', myjs.factory.ignore);
goog.exportProperty(module.exports['factory'], 'star', myjs.factory.star);
goog.exportProperty(module.exports['factory'], 'plus', myjs.factory.plus);
goog.exportProperty(module.exports['factory'], 'nonterm', myjs.factory.nonterm);
goog.exportProperty(module.exports['factory'], 'token', myjs.factory.token);
goog.exportProperty(module.exports['factory'], 'value', myjs.factory.value);
goog.exportProperty(module.exports['factory'], 'seq', myjs.factory.seq);
goog.exportProperty(module.exports, 'getDialect', myjs.getDialect);
goog.exportProperty(module.exports, 'Trie_', myjs.Trie_);
goog.exportProperty(module.exports, 'Syntax', myjs.Syntax);

// utils
goog.exportProperty(module.exports, 'utils', {});
goog.exportProperty(module.exports['utils'], 'toArray', myjs.utils.toArray);

// tedir
goog.exportProperty(module.exports, 'tedir', {});
goog.exportProperty(module.exports['tedir'], 'Parser', myjs.tedir.Parser);
goog.exportProperty(module.exports['tedir'], 'Syntax', myjs.tedir.Syntax);
goog.exportProperty(module.exports['tedir'], 'Error', myjs.tedir.Error);
goog.exportProperty(module.exports['tedir'], 'SyntaxError', myjs.tedir.SyntaxError);
goog.exportProperty(module.exports['tedir'], 'Invoker_', myjs.tedir.Invoker_);
goog.exportProperty(module.exports['tedir'], 'SourceOrigin', myjs.tedir.SourceOrigin);

