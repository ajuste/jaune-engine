/**
 * @file Source code for Reflection utility.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var Instance = new Reflection();
  var RegExp   = {
    requireToken : /^\[r\((.*)\)\]$/
  };
  /**
   *  Create an instance of the given constructor with the given arguments.
   *
   * @param {Function} constructor The constructing function.
   * @param {Array} args Arguments for the constructor
   * @returns The instance.
   */
  function applyNew(constructor, args) {

    var inst = Object.create(constructor.prototype);

    constructor.apply(inst, args);

    return inst;
  }
  /**
   * @class Builds an instance of the Reflection class.
   */
  function Reflection() {}
  /**
   * Prototype
   */
  Reflection.prototype = {

    createInstance : function(fullName, args, context) {

      var constructor = this.evaluateName(fullName, context);

      if (typeof constructor !== "function") {
        throw new Error("Full name points to invalid constructor");
      }
      return applyNew(constructor, args);
    },
    evaluateName : function(fullName, context) {

      if (typeof fullName !== "string") {
        throw new Error("Full name is not valid");
      }

      var segments = fullName.split(".");
      var segment = null;
      var root = context || global;

      for(var index = 0; index < segments.length; index++) {

        segment = (segment ? segment : root);

        if (RegExp.requireToken.test(segments[index])) {
          segment = require(segments[index].replace(RegExp.requireToken, "$1"));
        }
        else {
          segment = segment[segments[index]];
        }

        if (typeof segment === "undefined") {
          throw new Error("Full name points to invalid reference");
        }
      }
      return segment;
    }
  };
  module.exports = {
    Reflection : Instance
  };
})();
