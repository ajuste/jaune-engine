/**
 * @file Source code for SQL Database query executor.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var ErrorManager = require("../error/error-manager").Manager;

  /**
   * @class Query executor class that handles results and errors returned
   * by the database. It unifies different mechanisms for calling and callback.
   */
  var SqlQueryExecutor = function() { };
  /**
   * Prototype
   */
  SqlQueryExecutor.prototype = {
    /**
     *
     */
    execute : function* (client, query, parameters, type) {
      try {
        switch(type || "query") {
          case "query" :
            return yield client.query({ sql : query, args : parameters });
          case "call" :
            return yield client.call({ sql : query, args : parameters });
          default :
            throw new Error("Unsupported type: " + type);
        }
      }
      catch(err) {
        throw ErrorManager.asUnhandledError(err);
      }
    }
  };
  module.exports = {
    SqlQueryExecutor : new SqlQueryExecutor()
  };
})();
