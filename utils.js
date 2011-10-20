(function () {

function defineUtils(namespace) { // offset: 3

  namespace.toArray = toArray;
  /**
   * Converts any array-like object (including arguments objects) to a proper
   * array.
   */
  function toArray(args) {
    return Array.prototype.slice.call(args);
  }

  namespace.inherits = inherits;
  /**
   * Simple prototype-based inheritance.
   */
  function inherits(sub, sup) {
    function Inheriter() { }
    Inheriter.prototype = sup.prototype;
    sub.prototype = new Inheriter();
    sub.prototype.constructor = sub;
    sub.parent = sup;
  }

  namespace.getSource = function () {
    return String(defineUtils);
  };

  return namespace;

}

if (typeof module == "undefined") {
  this.utils = this.utils || defineUtils({});
} else {
  defineUtils(module.exports);
}

}).call(this);