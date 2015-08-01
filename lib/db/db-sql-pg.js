/**
 * @file Source code for POSTGRESQL client.
 * @author Alvaro Juste
 */

 (function() {

  "use strict";

  var Pg            = require("pg");
  var Environment   = null;
  var Debug         = require("../utils/debug").Debug;
  var DebugSettings = null;
  var _             = require("underscore");
  var LastId        = 0;
  var Q             = require("q");

  /**
   * @function Standarize sql error
   * @param {Object} err The sql error
   * @returns {Object} The error
   */
  var standarizeError = function(err) {

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
   */
  var PostgresClient = function(opts) {
    if (!Environment) {
      Environment = require("../server/environment").get();
      DebugSettings = Environment.getDebugSettings().sql;
    }
    this.opts = opts;
  };
  /**
   * Prototype
   */
  PostgresClient.prototype = {
    /**
     * @function Initializes a connection.
     * @param {Object} client Driver provided database client.
     * @param {Function} release Driver provided release function.
     * @returns {Object} A new connection.
     */
    initConnection : function(client, release) {
      client.jaune = "undefined" === typeof client.jaune ? new PostgresConnection(client, release, this.opts) : client.jaune;
      return client.jaune;
    },
    /**
     * @function Creates a new Link object.
     * @param {Boolean} [handleConnection] Handle connection flag.
     * @returns {Object} A new link.
     */
    getLink : function(handleConnection, tx) {
      return {
        handleConnection : typeof handleConnection === "boolean" ? handleConnection : true
      };
    },
    /**
     * @callback  Function provided to close.
     */
    __chainClose : function* (opts) {

      if (DebugSettings.links) {
        Debug.printText("Closing connection (" + this.id + ") from chained.");
      }
      yield this.close();
    },
    /**
     * @function Function that will reuse same connection or create a new one if no connection is provided.
     * @param {Object} [chainedClient] A client provided by this manager.
     */
    chain : function* (chainedClient) {

      var handleConnection = !chainedClient;
      var client           = null;

      try {

        client = handleConnection ? yield this.connect() : chainedClient;

        if (!handleConnection) {
          client.push(this.getLink(false), client);

          if (DebugSettings.links) {
            Debug.printText("Link pushed while connecting chained for connection (" + client.id + "): " + client.links.length);
          }
        }
        return client;
      }
      catch(err) {
        throw standarizeError(err);
      }
    },
    /**
     * @function Connect by providing pool name.
     */
    connect : function* () {

      var deferred = Q.defer();

      Pg.connect(this.opts.server, _.bind(function(err, cli, done) {

        var connection = this.initConnection(cli, done);

        if (connection.links.length !== 0) {
          deferred.reject(new Error("this connection is dirty - links already present: " + connection.links.length));
        }
        else {
          if (!err) {
            connection.links.push(this.getLink());
            if (DebugSettings.links) {
              Debug.printText("Link pushed while connecting for connection (" + connection.id + "): " + connection.links.length);
            }
            return deferred.resolve(connection);
          }
          deferred.reject(standarizeError(err));
        }
      }, this));

      return yield deferred.promise;
    },
    /**
     * @function Get count in connection pool.
     * @returns {Number} The count
     */
    getConnectionsCountInPool : function() {
      return Pg.pools.getOrCreate(this.opts.server).availableObjectsCount();
    },
    /**
     * @function Get connection pool size
     * @returns {Number} The pool size
     */
    getConnectionPoolSize : function() {
      return Pg.pools.getOrCreate(this.opts.server).getPoolSize();
    }
  };
  /**
   * @class POSTGRESQL connection handler.
   * @param {Object} opts Options
   * @param {Object} client Native client object.
   * @param {Function} release Function used to release connection which is provided by driver.
   */
  var PostgresConnection = function(client, release, opts) {
    this.release = release;
    this.client = client;
    this.opts = opts;
    this.links = [];
    this.tx = false;
    this.id = "PG-" + LastId++;
  };
  /**
   * Prototype
   */
  PostgresConnection.prototype = {
    /**
     * @function Initialize
     * @param {Object} client The postgresql client
     */
    init : function(client) {
      if ("undefined" === typeof client.jaune) {
        client.jaune = this;
      }
    },
    /**
     * @function Pushs a link
     * @param {Object} link A link
     */
    push : function(link) {
      this.links.push(link);
    },
    /**
     * @function Pops a link
     * @returns {Object} Current link
     */
    pop : function() {
      return this.links.pop();
    },
    /**
     * @function Gets current link
     * @returns {Object} Current link
     */
    current : function() {
      return this.links[this.links.length - 1];
    },
    /**
     * @function Evaluate if transaction is open
     * @returns {Boolean} True when transaction open
     */
    isTransactionOpen : function() {
      return this.tx === true;
    },
    /**
     * @function Sets open transaction open
     * @paran {Boolean} value The flag
     */
    setTransaction : function(value) {
      this.tx = value;
    },
    /**
     * @function Evaluate if any pending operation
     * @returns {Boolean} True when operation pending
     */
    anyPendingLink : function() {
      return this.links > 1;
    },
    /**
     * @function Begins a transaction.
     */
    begin : function* () {
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
    },
    /**
     * @function Rolls back a transaction.
     */
    rollback : function* () {
      try {
        if (this.current().handleConnection === true && this.isTransactionOpen()) {
          this.setTransaction(false);
          yield this.query({ sql: "ROLLBACK;" });
        }
      }
      catch(err) {
        throw standarizeError(err);
      }
    },
    /**
     * @function Commits a transaction.
     */
    commit : function* () {
      try {
        if (this.current().handleConnection === true && this.isTransactionOpen()) {
          yield this.query({ sql: "COMMIT;" });
        }
      }
      catch(err) {
        throw standarizeError(err);
      }
    },
    /**
     * @function Rolls back a transaction and close the connection.
     */
    rollbackAndClose : function* () {
      try{
        yield this.rollback();
        this.close();
      }
      catch(err) {
        throw standarizeError(err);
      }
    },
    /**
     * @function Commits a transaction and close the connection.
     */
    commitAndClose : function* () {
      try{
        yield this.commit();
        this.close();
      }
      catch(err) {
        throw standarizeError(err);
      }
    },
    /**
     * @function Execute a query
     * @param {Object} query.sql Query to be executed.
     * @param {Array} [query.args] Arguments
     */
    query : function* (query) {

      if (DebugSettings.queries) {
        Debug.printObject(query);
        Debug.printText((query.args || []).join(","));
      }
      try{
        return (yield Q.nbind(this.client.query, this.client, query.sql, query.args || [])).rows;
      }
      catch(err) {
        throw standarizeError(err);
      }
    },
    /**
     * @function Call a function / stored procedure
     * @param {Object} query.sql The name of the member to call
     * @param {Array} [query.args] Arguments
     */
    call : function* (query, cb) {
      var parameterIndex = 1;
      var args = query.args || [];

      return yield this.query({ sql : "SELECT * FROM " + query.sql + "(" + _.map(args, function(e) { return "$" + parameterIndex++; }).join(", ") + ");", args : query.args });
    },
    /**
     * @function Close the connection if no pending operations
     */
    close : function* () {
      yield this.commit();
      if (typeof this.release === "function") {
        var link = this.current();
        this.pop();
        if (DebugSettings.links) {
          Debug.printText("Link pop while closing for connection (" + this.id + "): " + this.links.length);
        }
        if (link.handleConnection === true) {
          if (DebugSettings.links) {
            Debug.printText("Connection released - " + this.id + ".");
          }
          this.release();
        }
      }
    },
    /**
     * @function Handle exception
     */
    exception : function() {
      this.close();
    }
  };
  module.exports = {
    PostgresClient : PostgresClient
  };
})();
