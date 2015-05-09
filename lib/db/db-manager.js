/**
 * @file Source code for Database Manager.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var Environment    = require("../server/environment").Environment;
  var Reflection     = require("../utils/reflection").Reflection;
  var ModuleName     = "linkstern/db-manager";
  var Handlers       = {};
  var UnhandledError = require("../error/errors").UnhandledError;
  var ModuleCodes    = {
    ConfigurationNotFound : "001",
    HandlerInstantiationFailed : "002",
    HandlerConstuctorNotFound : "003"
  };
  /**
   * @class Data base manager
   */
  var DatabaseManager = function() {};
  /**
   * Prorotype
   */
  DatabaseManager.prototype = {
    /**
     * @function Get client from configuration
     * @param {String} key The key
     * @returns {Object} The client
     */
    getClientFromConfiguration : function(key) {

      var handler = null;
      var configuration = Environment.getDatabaseConnection(key);

      if (typeof configuration === "undefined") {
        throw new UnhandledError({ message: "Connection not found: " + key, code : ModuleName  + ModuleCodes.ConfigurationNotFound });
      }
      //  try to get handler if loaded, if not load it.
      handler = Handlers[configuration.type];

      if (typeof handler === "undefined") {

        try {

          handler = Reflection.evaluateName(configuration.type);

          if (handler === null) {
            throw new UnhandledError({ message: "Constructor not found: " + configuration.type, code : ModuleName  + ModuleCodes.HandlerConstuctorNotFound, cause : err });
          }
        }
        catch(error) {
          throw new UnhandledError({ message: "Unable to instance configuration: " + key, code : ModuleName  + ModuleCodes.HandlerInstantiationFailed, cause : error });
        }
        Handlers[configuration.type] = handler;
      }
      return new handler(configuration);
    }
  };
  module.exports = {
    DatabaseManager : new DatabaseManager()
  };
})();
