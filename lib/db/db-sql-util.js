/**
 * @file Source code for SQL Database utility
 *
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  const _                = require("underscore");
  const ErrorManager     = require("../error/error-manager").Manager;
  const DbManager        = require("./db-manager").DatabaseManager;
  const SqlQueryExecutor = require("./db-sql-query-executor").SqlQueryExecutor;

  /**
   * @class High level utility which uses best practices and tools
   * of the framework. This utility should be used by modules
   * to send queries to database as it separates database
   * from the module.
   * @param {String} configurationKey The key that identifies the connection to use in configuration.
   */
  const SqlUtil = function(configurationKey) {
    this.configurationKey = configurationKey;
  };
  /**
   * Prototype
   */
  SqlUtil.prototype = {
    __getSql : function() {
      return (this.sql || (this.sql = DbManager.getClientFromConfiguration(this.configurationKey)));
    },
    /**
     * @function Returns callback to be used in chained call backs.
     * @param {Function} cb The chained callback to be called after default callback does required work.
     * @param {Object} executor Query executor
     * @param {*} [options.result] Result to be passed to callback. If passed, result from query is stored inside data property name.
     * @param {*} [resultProperty] Name of the property were to set result.
     * @returns {Function} The callback function
     */
    defaultCallback : function(cb, executor, options) {

      options = options || {};

      return function(err, result) {
        if (err) {
          executor.doError(cb, err);
        }
        else {
          if (options.result) {
            if (options.resultProperty) {
              options.result[options.resultProperty] = result;
              delete options.resultProperty;
            }
            else if ("undefined" === typeof options.result.data){
              options.result.data = result;
            }
          }
          executor.doSuccess(cb, options.result || result);
        }
      };
    },
    /**
     * @function Executes a call to an db object.
     * @param {*} client The client to execute query.
     * @param {String} query The query.
     * @param {Array} parameters Parameters for the query.
     */
    call : function* (client, query, parameters) {
      return yield this.query(client, query, parameters, "call");
    },
    /**
     * @function Executes a query.
     * @param {*} client The client to execute query.
     * @param {String} query The query.
     * @param {Array} parameters Parameters for the query.
     * @param {String} [type] Type of query
     */
    query : function* (client, query, parameters, type) {
      return yield SqlQueryExecutor.execute(client, query, parameters, type);
    },
    /**
     * @function Executes a function inside a chain. The function to be executed
     * will be passed with all tools in order to keep any live transaction functional.
     * @param {Function} fn Function to be executed.
     * @param {*} [chainedClient] Connection to use if any. Otherwise a new will be obtained.
     */
    executeChained : function* (fn, chainedClient) {
      let executor = yield this.chain(chainedClient);
      let result   = null;
      try {
        result = yield fn(executor);
        yield executor.doSuccess();
      }
      catch(err) {
        throw yield executor.doError(err);
      }
      return result;
    },
    /**
     * @function Execute a chained query
     * @param {Function} fn Function to be executed.
     * @param {*} [chainedClient] Connection to use if any. Otherwise a new will be obtained.
     */
    executeChainedQuery : function* (query, args, chainedClient) {
      return yield (this.executeChained(_.bind(function *(executor) {
        return yield this.query(executor.client, query, args);
      }, this), chainedClient));
    },
    /**
     * @function Execute a chained query
     * @param {Function} fn Function to be executed.
     * @param {*} [chainedClient] Connection to use if any. Otherwise a new will be obtained.
     */
    executeChainedCall : function* (query, args, chainedClient) {
      return yield (this.executeChained(_.bind(function *(executor) {
        return yield this.call(executor.client, query, args);
      }, this), chainedClient));
    },
    /**
     * @function Prepares chained execution.
     * @param {*} [chainedClient] Connection to use if any. Otherwise a new will be obtained.
     * @param {Object} [options] Options.
     */
    chain : function* (chainedClient, options) {

      options = _.defaults({ tx : false });

      let client = yield this.__getSql().chain(chainedClient);

      if (options.tx === true) {
        yield client.begin();
      }
      return new Executor(client);
    },
    /**
     * @function Converts an array of any to SQL parameter value.
     * @param {Array} array Array to convert.
     * @param {Function} [selector] Function that converts from input to string id.
     * @returns {String} Parameter.
     */
    toIdArray : function(array, selector) {
      return "{" + array.select(selector || function(e) { return "object" === typeof e ? e.id : e ; }).join() + "}";
    },
    /**
     * @function Default function to convert id of record into int.
     * @param {Object} e Record
     */
    convertIdToNumber : function(e) {
      e.id = parseInt(e.id, 10);
    }
  };
  /**
   * @class Executor used to be passed on chained calls.
   * @param {Object} client The SQL client
   *
   */
  const Executor = function(client) {
    this.client = client;
  };
  /**
   * Prototype
   */
  Executor.prototype = {
    /**
     * @function Marks success on this executor.
     */
    doSuccess : function* () {
      try {
        yield this.client.commit();
      }
      catch(err) {
        throw ErrorManager.asUnhandledError(err);
      }
      finally {
        yield this.doFinally();
      }
    },
    /**
     * @function Marks roll back on this executor.
     */
    doRollback : function* () {
      try {
        yield this.client.rollback();
      }
      catch(err) {
        throw ErrorManager.asUnhandledError(err);
      }
      finally {
        yield this.doFinally();
      }
    },
    /**
     * @function Marks error on this executor.
     */
    doError : function* (e) {
      try {
        yield this.client.rollback();
      }
      catch(err) {
        throw ErrorManager.asUnhandledError(err);
      }
      finally {
        yield this.doFinally();
      }
      return e;
    },
    /**
     * @function Do finally.
     * @param {Function} catchCallback Callback
     * @param {*} err Error
     */
    doFinally : function* (cb) {
      yield this.client.close();
    }
  };
  module.exports = {
    SqlUtil : SqlUtil
  };
})();
