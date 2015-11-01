/**
 * @file   Source code for MongooseDbClient.
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _mongoose = require("mongoose");
const _defer    = require("q").defer;
const _bind     = require("lodash").bind;

/**
 * @class Mongo DB client
 * @param {Object} config Options
 */
var MongooseDbClient = function(config) {
  this.config = config;
  this.connection = _mongoose.createConnection(config.url, config.opts);
  this.readyDeferred = _defer();
  this.readyPromise = this.readyDeferred.promise;
  this.connection.once("error", _bind(function(err) {
    this.readyDeferred.reject(err);
  }, this));
  this.connection.once("open", _bind(function() {
    this.readyDeferred.resolve(this.connection);
  }, this));
};

/**
 * @function Connect
 * @param    {Function} cb Callback
 */
MongooseDbClient.prototype.connect = function(cb) {
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
 * @returns  {Object} Mongoose
 */
MongooseDbClient.prototypegetMongoose = function() {
  return _mongoose;
};

module.exports = {
  MongooseDbClient : MongooseDbClient
};
