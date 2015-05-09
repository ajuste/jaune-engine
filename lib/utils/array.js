/**
 * @file Source code for Array extensions
 * @author Alvaro Juste
 */
(function() {
  "use strict";
  /**
   * Aggregates items over a seed.
   * @function
   * @param {Function} fn Aggregation function.
   * @param {*} [context] Context to apply function.
   * @param {*} seed The original value.
   * @returns {*} Aggregated value
   */
  Array.prototype.aggregate = function(fn, seed, context) {
    var
    total = seed && typeof seed === "number" && !isNaN(parseFloat(seed)) ? parseFloat(seed) : 0;

    for(var i = 0; i < this.length; i++) {
      total += fn.call(context || this, this[i], i);
    }
    return total;
  };
  /**
   * Gets last item of the array or undefined.
   * @returns {*} Last item
   */
  Array.prototype.last = function() {
    return this.length > 0 ? this[this.length - 1] : undefined;
  };
  Array.prototype.first = function(fn, context) {
    var
    self = this;

    fn = fn || function() {
      return self.length > 0;
    };
    for(var i = 0; i < this.length; i ++) {
      if (fn.call(context || this, this[i], i)) {
        return this[i];
      }
    }
    return undefined;
  };
  /**
   * Applies a function to each element.
   * @function
   * @param {Function} fn Function to apply.
   * @param {*} [context] Context to apply function.
   */
  Array.prototype.forEach = function(fn, context) {
    for(var i = 0; i < this.length; i++) {
      fn.call(context || this, this[i], i);
    }
  };
  /**
   * Selects many/
   * @function
   * @param {Function} fn Select function.
   * @param {*} [context] Context to apply function.
   */
  Array.prototype.selectMany = function(fn, context) {
    var
    r = [];

    this.select(fn, context).forEach(function(item) {
      r.push(item);
    }, this);

    return r;
  };
  /**
   * Slices array and goes over slices.
   * @function
   * @param {Number} size Size of slices.
   * @param {Function} fn Slice processing function.
   * @param {*} [context] Context to apply function.
   */
  Array.prototype.slicesOf = function(size, fn, context) {
    for(var i = 0; i < this.length; i += size) {
      fn.call(context || this, this.slice(i, i + size));
    }
  };
  /**
   * Slices array and goes over slices in async way.
   * @function
   * @param {Number} size Size of slices.
   * @param {Function} fn Slice processing function.
   * @param {*} [context] Context to apply function.
   * @returns {Function} Returns callback to process next slice.
   */
  Array.prototype.slicesOfAsync = function(size, fn, context) {

    return (function() {

      var
      i = 0,
      arr = this;

      return function callback(array) {

        array = array || arr;

        if (i < array.length) {
          i += size;
          fn.call(context || array, array.slice(i - size, i));
          return true;
        }
        else {
          return false;
        }
      };
    }).call(this);
  };
  /**
   * Selects a single object where evaluation function is positive.
   * @function
   * @param {Function} fn Evaluation function.
   * @param {*} [context] Context to apply function.
   * @returns {Array} Selected object or undefined.
   */
  Array.prototype.single = function(fn, context) {
    for(var i = 0; i < this.length; i++) {
      if (fn.call(context || this, this[i]) === true) {
        return this[i];
      }
    }
    return undefined;
  };
  /**
   * Returns a new array with selected objects from a function.
   * @function
   * @param {Function} fn Selecting function.
   * @param {*} [context] Context to apply function.
   * @returns {Array} The object array.
   */
  Array.prototype.select = function(fn, context) {
    var
    r = [];
    for(var i = 0; i < this.length; i++) {
      r.push(fn.call(context || this, this[i]));
    }
    return r;
  };
  /**
   * Returns true if any element validates to true.
   * @function
   * @param {Function} fn Evaluation function.
   * @param {*} [context] Context to apply function.
   * @returns {Array} The filtered array.
   */
  Array.prototype.any = function(fn, context) {
    for(var i = 0; i < this.length; i++) {
      if (fn.call(context || this, this[i]) === true) {
        return true;
      }
    }
    return false;
  };
  /**
   * Returns a new array with objects that evaluates to true of a given function.
   * @function
   * @param {Function} fn Evaluation function.
   * @param {*} [context] Context to apply function.
   * @returns {Array} The filtered array.
   */
  Array.prototype.where = function(fn, context) {
    var
    r = [];
    for(var i = 0; i < this.length; i++) {
      if (fn.call(context || this, this[i]) === true) {
        r.push(this[i]);
      }
    }
    return r;
  };
  /**
   * Adds all items of an array.
   * @function
   * @param {Array} arr Array
   */
  Array.prototype.addRange = function(arr) {
    arr.forEach(function(e) {
      this.push(e);
    }, this);
  };
  /**
   * Maps array to an object having a function as key generator.
   * @function
   * @param {Function} fn Key generator.
   * @param {*} [context] Context to apply function.
   * @returns {Array} Mapped object.
   */
  Array.prototype.toMap = function(fn, context) {
    var
    map = {};

    this.forEach(function(e) {
      map[fn.call(context || this, e)] = e;
    }, this);
    return map;
  };
  /**
   * Orders bu ascending
   * @function
   * @param {Function} fn Sorting function
   * @returns {Array} Sorted array.
   */
  Array.prototype.orderBy = function(fn) {
    var
    r = [];
    r.addRange(this);
    r.sort(fn);
    return r;
  };
  /**
   * Orders by descending.
   * @function
   * @param {Function} fn Sorting function
   * @returns {Array} Sorted array.
   */
  Array.prototype.orderByDescending = function(fn) {
    var
    r = [],
    s = this.orderBy(fn);
    for(var i = s.length - 1; i >= 0; i--) {
      r.push(s[i]);
    }
    return r;
  };
  /**
   * Remove all elements from an array.
   * @function
   */
  Array.prototype.clear = function() {
    this.length = 0;
  };
})();
