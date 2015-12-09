/**
 * @file   Source code for SQL Database utility
 * @author Alvaro Juste
 */

"use strict";

// 3rd
const _bind        = require("lodash").bind;
const _defaults    = require("lodash").defaults;

/**
 * @class High level utility which uses best practices and tools
 *        of the framework. This utility should be used by modules
 *        to send queries to database as it separates database
 *        from the module.
 * @param {String} configurationKey The key that identifies the connection.
 * @param {Object} dbManager Data base manager
 */
const SqlUtil = function(configurationKey, dbManager) {
  this.configurationKey = configurationKey;
  this.dbManager        = dbManager;
};

SqlUtil.prototype.getSql = function() {
  return (this.sql || (this.sql = this.dbManager.getClientFromConfiguration(this.configurationKey)));
};

/**
 * @function Returns callback to be used in chained call backs.
 * @param    {Function} cb The chained callback to be called after default callback does required work.
 * @param    {Object} executor Query executor
 * @param    {*} [options.result] Result to be passed to callback. If passed, result from query is stored inside data property name.
 * @param    {*} [resultProperty] Name of the property were to set result.
 * @returns  {Function} The callback function
 */
SqlUtil.prototype.defaultCallback = function(cb, executor, options) {

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
};

/**
 * @function Executes a call to an db object.
 * @param    {*} client The client to execute query.
 * @param    {String} query The query.
 * @param    {Array} parameters Parameters for the query.
 */
SqlUtil.prototype.call = function* (client, query, parameters) {
  return yield this.query(client, query, parameters, "call");
};

/**
 * @function Executes a query.
 * @param {*} client The client to execute query.
 * @param {String} query The query.
 * @param {Array} parameters Parameters for the query.
 * @param {String} [type] Type of query
 */
SqlUtil.prototype.query = function* (client, query, parameters, type) {
  switch(type || "query") {
    case "query" :
      return yield client.query({ sql : query, args : parameters });
    case "call" :
      return yield client.call({ sql : query, args : parameters });
    default :
      throw new Error("Unsupported type: " + type);
  }
};

/**
 * @function Executes a function inside a chain. The function to be executed
 *           will be passed with all tools in order to keep any live
 *           transaction functional.
 * @param    {Function} fn Function to be executed.
 * @param    {*} [chainedClient] Connection to use if any. Otherwise a new will be obtained.
 */
SqlUtil.prototype.executeChained = function* (fn, chainedClient) {
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
};

/**
 * @function Execute a chained query
 * @param    {Function} fn Function to be executed.
 * @param    {*} [chainedClient] Connection to use if any. Otherwise a new will be obtained.
 */
SqlUtil.prototype.executeChainedQuery = function* (query, args, chainedClient) {
  return yield (this.executeChained(_bind(function *(executor) {
    return yield this.query(executor.client, query, args);
  }, this), chainedClient));
};

/**
 * @function Execute a chained query
 * @param    {Function} fn Function to be executed.
 * @param    {*} [chainedClient] Connection to use if any. Otherwise a new will be obtained.
 */
SqlUtil.prototype.executeChainedCall = function* (query, args, chainedClient) {
  return yield (this.executeChained(_bind(function *(executor) {
    return yield this.call(executor.client, query, args);
  }, this), chainedClient));
};

/**
 * @function Prepares chained execution.
 * @param    {*} [chainedClient] Connection to use if any. Otherwise a new will be obtained.
 * @param    {Object} [options] Options.
 */
SqlUtil.prototype.chain = function* (chainedClient, options) {

  options = _defaults({ tx : false });

  let client = yield this.getSql().chain(chainedClient);

  if (options.tx === true) {
    yield client.begin();
  }
  return new Executor(client);
};

/**
 * @function Converts an array of any to SQL parameter value.
 * @param    {Array} array Array to convert.
 * @param    {Function} [selector] Function that converts from input to string id.
 * @returns  {String} Parameter.
 */
SqlUtil.prototype.toIdArray = function(array, selector) {
  return "{" + array.select(selector || function(e) { return "object" === typeof e ? e.id : e ; }).join() + "}";
};

/**
 * @function Default function to convert id of record into int.
 * @param    {Object} e Record
 */
SqlUtil.prototype.convertIdToNumber = function(e) {
  e.id = parseInt(e.id, 10);
};

/**
 * @function Executes a query within the given client
 * @param    {Object} client The client
 * @param    {String} query The query
 * @param    {Array}  parameters The parameters for the query
 * @param    {String} type The query type
 */
SqlUtil.prototype.execute = function* (client, query, parameters, type) {
  switch(type || "query") {
    case "query" :
      return yield client.query({ sql : query, args : parameters });
    case "call" :
      return yield client.call({ sql : query, args : parameters });
    default :
      throw new Error("Unsupported type: " + type);
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
 * @function Marks success on this executor.
 */
Executor.prototype.doSuccess = function* () {
  try {
    yield this.client.commit();
  }
  finally {
    yield this.doFinally();
  }
};

/**
 * @function Marks roll back on this executor.
 */
Executor.prototype.doRollback = function* () {
  try {
    yield this.client.rollback();
  }
  finally {
    yield this.doFinally();
  }
};

/**
 * @function Marks error on this executor.
 */
Executor.prototype.doError = function* (e) {
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
};

/**
 * @function Do finally.
 * @param    {Function} catchCallback Callback
 * @param    {*} err Error
 */
Executor.prototype.doFinally = function* (cb) {
  yield this.client.close();
};

module.exports = {
  SqlUtil : SqlUtil
};
