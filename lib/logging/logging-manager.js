/**
 * @file Source code for Logging Manager.
 * @author Alvaro Juste
 */

"use strict";

const _reflection = require("jaune-util").Reflection;
const _instances  = {};

/**
 * @class Manages logging in the application.
 */
const LoggingManager = function(env) {
  t
  his.env = env;
};
/**
 * @function Gets the instance of a logger by name
 * @param    {String} loggerName The logger name
 * @returns  {Object} Returns new instance of object
 * @throws   {Error} When logger is not found
 */
 LoggingManager.prototype.instance = function(loggerName) {

  if (!_instances[loggerName]) {

    var set = this.env.getLogging(loggerName);

    if (set) {
      _instances[loggerName] = {
        instance : _reflection.createInstance(set.module, [set]),
        settings : set
      };
    }
    else {
      throw new Error("Logger not registered: " + loggerName);
    }
  }
  return _instances[loggerName].instance;
};
module.exports = {
  Manager : LoggingManager
};
