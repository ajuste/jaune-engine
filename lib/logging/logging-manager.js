/**
 * @file Source code for Logging Manager.
 * @author Alvaro Juste
 */

(function() {

  "use strict";

  var require       = _require();
  var Environment = null;
  var Reflection  = require("/lib/utils/reflection").Reflection;
  var Instances   = {};
  /**
   * @class Manages logging in the application.
   */
  var LoggingManager = function() {
    if (!Environment) {
      Environment = require("/lib/server/environment").get();
    }
  };
  /**
   * Prototype
   */
  LoggingManager.prototype = {
    /**
     * @function Gets the instance of a logger by name
     * @param {String} loggerName The logger name
     * @returns {Object} Returns new instance of object
     * @throws {Error} When logger is not found
     */
    instance : function(loggerName) {

      if (!Instances[loggerName]) {

        var set = Environment.getLogging(loggerName);

        if (set) {
          Instances[loggerName] = {
            instance : Reflection.createInstance(set.module, [set]),
            settings : set
          };
        }
        else {
          throw new Error("Logger not registered: " + loggerName);
        }
      }
      return Instances[loggerName].instance;
    }
  };
  module.exports = {
    LoggingManager : new LoggingManager()
  };
})();
