/**
 * @file Source code for Reflection utility.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var _      = require("underscore");
  var Path   = require("path");
  var RegExp = {
    requireToken : /^\[(\w{1})\((.+)\)\]/
  };
  var Tokens = {
    Require : "r",
    Module  : "m",
    Namespace  : "n"
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
  var Reflection = function() {};
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

      var segment = null;
      var root = context || global;
      var segments = [];
      var requireSegment = RegExp.requireToken.exec(fullName);
      var curSegment;

      if (requireSegment) {
        segments.push({
          type : requireSegment[1],
          name : requireSegment[2]
        });
        fullName = fullName.replace(RegExp.requireToken, "");
      }
      _.each(_.filter(fullName.split("."), function(e){
        return !!e;
      }), function(e) {
        segments.push({
          type : Tokens.Namespace,
          name : e
        });
      });

      for(var _index = 0, _length = segments.length; _index < _length; _index++) {

        segment = segment || root;
        curSegment = segments[_index];

        switch(curSegment.type) {
          case Tokens.Require :
            segment = require(curSegment.name.indexOf("/") !== -1 ? Path.join(process.cwd(), curSegment.name) : curSegment.name);
            break;
          case Tokens.Module :
            segment = require(curSegment.name);
            break;
          case Tokens.Namespace :
            segment = segment[curSegment.name];
            break;
          default :
            throw new Error("Unsupported segment type: " + curSegment.type);
        }
        if (!segment) {
          throw new Error("Full name points to invalid reference");
        }
      }
      return segment;
    }
  };
  module.exports = {
    Reflection : new Reflection()
  };
})();
