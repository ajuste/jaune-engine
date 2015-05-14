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
  var UnderScore    = require("underscore");
  var LastId        = 0;

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
     * @function Function that will reuse same connection or create a new
     * one if no connection is provided.
     * @param {Function} cb Callback.
     * @param {Object} [chainedClient] A client provided by this manager.
     */
    chain : function(cb, chainedClient) {

      var handleConnection = !chainedClient;
      var effectiveClient  = null;

      /**
       * @callback  Function provided to close.
       * @param {Object} opts Options passed to callback
       */
      function close(opts) {

        opts = opts || {};

        if (DebugSettings.links) {
          Debug.printText("Closing connection (" + effectiveClient.id + ") from chained.");
        }
        effectiveClient.close(function() {
          if (cb.end) {

            if (cb.end.length === 1) {
              cb.end(opts);
            }
            else {
              cb.end(standarizeError(opts.error), opts.result);
            }
          }
        });
      }
      /**
       * @function On connect.
       * @param {Object} newClient Client provided by driver to be used on subsequent calls.
       * @param {*} err Error that might have been raised.
       */
      function onConnect(newClient, err) {

        effectiveClient = newClient;

        if (!err && !handleConnection) {

          effectiveClient.push(this.getLink(false), effectiveClient);

          if (DebugSettings.links) {
            Debug.printText("Link pushed while connecting chained for connection (" + effectiveClient.id + "): " + effectiveClient.links.length);
          }
        }
        cb.connect(effectiveClient, standarizeError(err), close);
      }
      if (handleConnection) {
        this.connect(UnderScore.bind(onConnect, this));
      }
      else {
        onConnect.call(this, chainedClient);
      }
    },
    /**
     * @function Connect by providing pool name.
     * @param {Function} callback The callback
     */
    connect : function(callback) {
      Pg.connect(this.opts.server, UnderScore.bind(function(err, cli, done) {

        var connection = this.initConnection(cli, done);

        if (connection.links.length !== 0) {
          callback(undefined, new Error("this connection is dirty - links already present: " + connection.links.length));
        }
        else {
          if (!err) {
            connection.links.push(this.getLink());
            if (DebugSettings.links) {
              Debug.printText("Link pushed while connecting for connection (" + connection.id + "): " + connection.links.length);
            }
          }
          callback(connection, standarizeError(err));
        }
      }, this));
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
     * @param {function} callback The callback
     */
    begin : function(callback) {
      if (!this.isTransactionOpen()) {
        this.query({ sql: "BEGIN;" }, UnderScore.bind(this.__onBeginQueryExecuted, this, cb));
      }
      else {
        onBegin.call(this);
      }
    },
    /**
     * @callback On begin query executed
     * @param {Object} [err] Possible error
     * @param {Function} [cb] Callback
     */
    __onBeginQueryExecuted : function(cb, err) {
      if (!err) {
        this.setTransaction(true);
      }
      if (callback) {
        callback(standarizeError(err));
      }
    },
    /**
     * @function Rolls back a transaction.
     * @param {function} [cb] The callback
     */
    rollback : function(cb) {
      if (this.current().handleConnection === true && this.isTransactionOpen()) {
        this.query({ sql: "ROLLBACK;" }, UnderScore.bind(this.__onRollbackQueryExecuted, this, cb));
      }
      else {
        cb();
      }
    },
    /**
     * @callback On rollback query executed
     * @param {Object} [err] Possible error
     * @param {Function} [cb] Callback
     */
    __onRollbackQueryExecuted : function(cb, err) {
      if (!err) {
        this.setTransaction(false);
      }
      if (callback) {
        callback(standarizeError(err));
      }
    },
    /**
     * @function Commits a transaction.
     * @param {function} [cb] The callback
     */
    commit : function(cb) {
      if (this.current().handleConnection === true && this.isTransactionOpen()) {
        this.query({ sql: "COMMIT;" }, UnderScore.bind(this.__onCommitQueryExecuted, this, cb));
      }
      else {
        cb();
      }
    },
    /**
     * @callback On commit query executed
     * @param {Object} [err] Possible error
     * @param {Function} [cb] Callback
     */
    __onCommitQueryExecuted : function(cb, err) {
      if (!err) {
        this.setTransaction(false);
      }
      if (cb) {
        cb(standarizeError(err));
      }
    },
    /**
     * @function Rolls back a transaction and close the connection.
     * @param {function} [cb] The callback
     */
    rollbackAndClose : function(cb) {
      this.rollback(UnderScore.bind(this.__onRollbackAndClose, this, cb));
    },
    /**
     * @callback On rollback and close
     * @param {Object} [err] Possible error
     * @param {Function} [cb] Callback
     */
    __onRollbackAndClose : function(cb, err) {
      this.close();
      callback(standarizeError(err));
    },
    /**
     * @function Commits a transaction and close the connection.
     * @param {function} [cb] The callback
     */
    commitAndClose : function(cb) {
      this.commit(UnderScore.bind(this.__onCommitAndClose, this, cb));
    },
    /**
     * @callback On commit and close
     * @param {Object} [err] Possible error
     * @param {Function} [cb] Callback
     */
    __onCommitAndClose : function(cb, err) {
      this.close();
      callback(standarizeError(err));
    },
    /**
     * @function Execute a query
     * @param {Object} query.sql Query to be executed.
     * @param {Array} [query.args] Arguments
     * @param {Function} [cb] Callback
     */
    query : function(query, cb) {

      if (DebugSettings.queries) {
        Debug.printObject(query);
        Debug.printText((query.args || []).join(","));
      }
      this.client.query(query.sql, query.args || [], UnderScore.bind(this.__onQueryCallback, this, cb));
    },
    /**
     * @callback On query executed
     * @param {Object} [err] Possible error
     * @param {Array} [results] Results
     * @param {Function} [cb] Callback
     */
    __onQueryCallback : function(cb, err, results) {
      if (cb) {
        cb(standarizeError(err), err ? undefined : results.rows, this.client);
      }
    },
    /**
     * @function Call a function / stored procedure
     * @param {Object} query.sql The name of the member to call
     * @param {Array} [query.args] Arguments
     * @param {Function} [callback] Callback
     */
    call : function(query, callback) {

      var parameterIndex = 1;
      var args = query.args || [];

      this.query({ sql : "SELECT * FROM " + query.sql + "(" + args.select(function(e) { return "$" + parameterIndex++; }).join(", ") + ");", args : query.args }, callback);
    },
    /**
     * @function Close the connection if no pending operations
     * @param {Function} cb The callback
     */
    close : function(cb) {
      this.commit(UnderScore.bind(this.__onCloseCommit, this, cb));
    },
    /**
     * @callback On close commit
     * @param {Function} cb The callback
     */
    __onCloseCommit : function(cb) {
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
        if (cb) {
          cb();
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
