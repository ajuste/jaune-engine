/**
 * @file   Source code for POSTGRESQL client.
 * @author Alvaro Juste
 */

"use strict";

// 3rd
const _pgConnect = require("pg").connect;
const _pgPoolGet = require("pg").pools.getOrCreate
const _bind      = require("lodash").bind;
const _map       = require("lodash").map;
const _nbind     = require("q").nbind;
const _defer     = require("q").defer;

// jaune
const _debug     = require("jaune-util").Debug;

// constants
const DEBUG_CONFIG_SECTION = "debug";

// variables
let _lastId = 0;

/**
 * @function Standarize sql error
 * @param    {Object} err The sql error
 * @returns  {Object} The error
 */
const standarizeError = function(err) {

  var result    = err;
  var fieldText = null;

  if (err && "object" === typeof err) {
    if ("undefined" !== typeof err) {
      try {
        fieldText = JSON.stringify({
          arguments : err.arguments,
          code : err.code,
          detail : err.detail,
          file : err.file,
          hint : err.hint,
          internalPosition : err.internalPosition,
          internalQuery : err.internalQuery,
          length : err.length,
          line : err.line,
          message : err.message,
          name : err.name,
          position : err.position,
          routine : err.routine,
          severity : err.severity,
          stack : err.stack,
          type : err.type,
          where : err.where
        });
      }
      catch(ex) {
        fieldText = "Error while standarizing exception: " + ex;
      }
      finally {
        result.causeToString = fieldText;
      }
    }
  }
  return result;
};
/**
 * @class PostgreSQL client
 * @param {Object} opts The options
 * @param {Object} env The environment
 */
const PostgresClient = function(opts, env) {
  this.debugSettings = env.getEnvProperty(DEBUG_CONFIG_SECTION, "sql");
  this.opts          = opts;
  this.env           = env;
};

/**
 * @function Initializes a connection.
 * @param    {Object} client Driver provided database client.
 * @param    {Function} release Driver provided release function.
 * @returns  {Object} A new connection.
 */
PostgresClient.prototype.initConnection = function(client, release) {
  client.jaune = "undefined" === typeof client.jaune ? new PostgresConnection(client, release, this.env) : client.jaune;
  return client.jaune;
};

/**
 * @function Creates a new Link object.
 * @param    {Boolean} [handleConnection] Handle connection flag.
 * @returns  {Object} A new link.
 */
PostgresClient.prototype.getLink = function(handleConnection, tx) {
  return {
    handleConnection : typeof handleConnection === "boolean" ? handleConnection : true
  };
};

/**
 * @callback  Function provided to close.
 */
PostgresClient.prototype.__chainClose = function* (opts) {

  if (this.debugSettings.links) {
    _debug.printText("Closing connection (" + this.id + ") from chained.");
  }
  yield this.close();
};

/**
 * @function Function that will reuse same connection or create a new one if no connection is provided.
 * @param    {Object} [chainedClient] A client provided by this manager.
 */
PostgresClient.prototype.chain = function* (chainedClient) {

  var handleConnection = !chainedClient;
  var client           = null;

  try {

    client = handleConnection ? yield this.connect() : chainedClient;

    if (!handleConnection) {
      client.push(this.getLink(false), client);

      if (this.debugSettings.links) {
        _debug.printText("Link pushed while connecting chained for connection (" + client.id + "): " + client.links.length);
      }
    }
    return client;
  }
  catch(err) {
    throw standarizeError(err);
  }
};

/**
 * @function Connect by providing pool name.
 */
PostgresClient.prototype.connect = function* () {

  var deferred = _defer();

  _pgConnect(this.opts.server, _.bind(function(err, cli, done) {

    var connection = this.initConnection(cli, done);

    if (connection.links.length !== 0) {
      deferred.reject(new Error("this connection is dirty - links already present: " + connection.links.length));
    }
    else {
      if (!err) {
        connection.links.push(this.getLink());
        if (this.debugSettings.links) {
          _debug.printText("Link pushed while connecting for connection (" + connection.id + "): " + connection.links.length);
        }
        return deferred.resolve(connection);
      }
      deferred.reject(standarizeError(err));
    }
  }, this));

  return yield deferred.promise;
};

/**
 * @function Get count in connection pool.
 * @returns  {Number} The count
 */
PostgresClient.prototype.getConnectionsCountInPool = function() {
  return _pgPoolGet.getOrCreate(this.opts.server).availableObjectsCount();
};

/**
 * @function Get connection pool size
 * @returns  {Number} The pool size
 */
PostgresClient.prototype.getConnectionPoolSize = function() {
  return _pgPoolGet.getOrCreate(this.opts.server).getPoolSize();
};

/**
 * @class POSTGRESQL connection handler.
 * @param {Object} opts Options
 * @param {Object} client Native client object.
 * @param {Function} release Function used to release connection which is provided by driver.
 */
var PostgresConnection = function(client, release, env) {
  this.release = release;
  this.client  = client;
  this.opts    = env;
  this.links   = [];
  this.tx      = false;
  this.id      = "PG-" + _lastId++;
};

/**
 * @function Initialize
 * @param    {Object} client The postgresql client
 */
PostgresConnection.prototype.init = function(client) {
  if ("undefined" === typeof client.jaune) {
    client.jaune = this;
  }
};

/**
 * @function Pushs a link
 * @param    {Object} link A link
 */
PostgresConnection.prototype.push = function(link) {
  this.links.push(link);
};

/**
 * @function Pops a link
 * @returns  {Object} Current link
 */
PostgresConnection.prototype.pop = function() {
  return this.links.pop();
};

/**
 * @function Gets current link
 * @returns  {Object} Current link
 */
PostgresConnection.prototype.current = function() {
  return this.links[this.links.length - 1];
};

/**
 * @function Evaluate if transaction is open
 * @returns  {Boolean} True when transaction open
 */
PostgresConnection.prototype.isTransactionOpen = function() {
  return this.tx === true;
};

/**
 * @function Sets open transaction open
 * @param  {Boolean} value The flag
 */
PostgresConnection.prototype.setTransaction = function(value) {
  this.tx = value;
};

/**
 * @function Evaluate if any pending operation
 * @returns  {Boolean} True when operation pending
 */
PostgresConnection.prototype.anyPendingLink = function() {
  return this.links > 1;
};

/**
 * @function Begins a transaction.
 */
PostgresConnection.prototype.begin = function* () {
  try {
    if (!this.isTransactionOpen()) {
      yield this.__onBeginQueryExecuted();
      this.setTransaction(true);
      yield this.query({ sql: "BEGIN;" });
    }
    else {
      //TODO: Remove
      throw "Should not be here";
    }
  }
  catch(err) {
    throw standarizeError(err);
  }
};

/**
 * @function Rolls back a transaction.
 */
PostgresConnection.prototype.rollback = function* () {
  try {
    if (this.current().handleConnection === true && this.isTransactionOpen()) {
      this.setTransaction(false);
      yield this.query({ sql: "ROLLBACK;" });
    }
  }
  catch(err) {
    throw standarizeError(err);
  }
};

/**
 * @function Commits a transaction.
 */
PostgresConnection.prototype.commit = function* () {
  try {
    if (this.current().handleConnection === true && this.isTransactionOpen()) {
      yield this.query({ sql: "COMMIT;" });
    }
  }
  catch(err) {
    throw standarizeError(err);
  }
};

/**
 * @function Rolls back a transaction and close the connection.
 */
PostgresConnection.prototype.rollbackAndClose = function* () {
  try{
    yield this.rollback();
    this.close();
  }
  catch(err) {
    throw standarizeError(err);
  }
};

/**
 * @function Commits a transaction and close the connection.
 */
PostgresConnection.prototype.commitAndClose = function* () {
  try{
    yield this.commit();
    this.close();
  }
  catch(err) {
    throw standarizeError(err);
  }
};

/**
 * @function Execute a query
 * @param {Object} query.sql Query to be executed.
 * @param {Array} [query.args] Arguments
 */
PostgresConnection.prototype.query = function* (query) {

  if (this.debugSettings.queries) {
    _debug.printObject(query);
    _debug.printText((query.args || []).join(","));
  }
  try{
    return (yield _nbind(this.client.query, this.client, query.sql, query.args || [])).rows;
  }
  catch(err) {
    throw standarizeError(err);
  }
};

/**
 * @function Call a function / stored procedure
 * @param   {Object} query.sql The name of the member to call
 * @param   {Array} [query.args] Arguments
 */
PostgresConnection.prototype.call = function* (query, cb) {
  var parameterIndex = 1;
  var args = query.args || [];

  return yield this.query({ sql : "SELECT * FROM " + query.sql + "(" + _map(args, function(e) { return "$" + parameterIndex++; }).join(", ") + ");", args : query.args });
};

/**
 * @function Close the connection if no pending operations
 */
PostgresConnection.prototype.close = function* () {
  yield this.commit();
  if (typeof this.release === "function") {
    var link = this.current();
    this.pop();
    if (this.debugSettings.links) {
      _debug.printText("Link pop while closing for connection (" + this.id + "): " + this.links.length);
    }
    if (link.handleConnection === true) {
      if (this.debugSettings.links) {
        _debug.printText("Connection released - " + this.id + ".");
      }
      this.release();
    }
  }
};

/**
 * @function Handle exception
 */
PostgresConnection.prototype.exception = function() {
  this.close();
};

module.exports = {
  PostgresClient : PostgresClient
};
