/**
 * @file Source code for SQL Database query executor.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var ErrorManager = require("../error/error-manager").ErrorManager;

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
    execute : function(client, query, parameters, cb, context, type) {

      try {

        var callback = function(err, results) {

          err = ErrorManager.asUnhandledError(err);

          if (cb && (cb.step || cb.end)) {
            var effectiveCb = (cb.step || cb.end);

            if (effectiveCb.length == 1) {
              effectiveCb.call(context || this, {client : client, error : err, result : results});
            }
            else {
              effectiveCb.call(context || this, err, results, client);
            }
          }
        };
        switch(type || "query") {
          case "query" :
            client.query({ sql : query, args : parameters }, callback);
            break;
          case "call" :
            client.call({ sql : query, args : parameters }, callback);
            break;
          default :
            throw new Error("Unsupported type: " + type);
        }
      }
      catch(error) {
        var handledError = ErrorManager.asUnhandledError(error);
        if (cb) {
          if (cb.end) {
            cb.end({client : client, error : handledError});
          }
          if (cb.error) {
            cb.error({client : client, error : handledError});
          }
        }
      }
    }
  };
  module.exports = {
    SqlQueryExecutor : new SqlQueryExecutor()
  };
})();
