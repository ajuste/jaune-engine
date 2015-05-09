/**
 * @file Source code for MongooseDbClient.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var Mongoose   = require("mongoose");
  var Q          = require("q");
  var UnderScore = require("underscore");
  /**
   * @class Mongo DB client
   * @param {Object} config Options
   */
  var MongooseDbClient = function(config) {
    this.config = config;
    this.connection = Mongoose.createConnection(config.url, config.opts);
    this.readyDeferred = Q.defer();
    this.readyPromise = this.readyDeferred.promise;
    this.connection.once("error", UnderScore.bind(function(err) {
      this.readyDeferred.reject(err);
    }, this));
    this.connection.once("open", UnderScore.bind(function() {
      this.readyDeferred.resolve(this.connection);
    }, this));
  };
  MongooseDbClient.prototype = {
    /**
     * @function Connect
     * @param {Function} cb Callback
     */
    connect : function(cb) {
      this
      .readyPromise
      .then(function(conn) {
        cb(undefined, conn);
      })
      .fail(function(err) {
        cb(err);
      });
    },
    /**
     * @function Get Mongoose handler.
     * @returns {Object} Mongoose
     */
    Mongoose : function() {
      return Mongoose;
    }
  };
  module.exports = {
    MongooseDbClient : MongooseDbClient
  };
})();
