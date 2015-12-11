/**
 * @file   Source code for Database Manager.
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _isUndefined    = require("lodash").isUndefined;

// jaune
const _reflection     = require("jaune-util").Reflection;
const _moduleName     = "linkstern/db-manager";
const _handlers       = {};
const _unhandledError = require("../error").UnhandledError;

// constants
/**
 * @constant Error codes for the module
 */
const _moduleCodes    = {
  ConfigurationNotFound      : "001",
  HandlerInstantiationFailed : "002",
  HandlerConstuctorNotFound  : "003"
};

/**
 * @constant section name for data base configuration
 */
const DB_CONFIG_CONN = "jaune.db.connections";

/**
 * @class Data base manager
 * @param {Object} env Environment
 */
const DatabaseManager = function(env) {
  this.env = env;
};

/**
 * @function Get client from configuration
 * @param    {String} key The key
 * @returns  {Object} The client
 */
DatabaseManager.prototype.getClientFromConfiguration = function(key) {

  let   handler = null;
  const configuration = this.env.getEnvProperty(DB_CONFIG_CONN, key);

  if (_isUndefined(configuration)) {
    throw new _unhandledError({
      message: `Connection not found "${key}"`,
      code : [_moduleName, _moduleCodes.ConfigurationNotFound].join("/") });
  }
  //  try to get handler if loaded, if not load it.
  handler = _handlers[configuration.type];

  if (_isUndefined(handler)) {

    try {
      handler = _reflection.evaluateName(configuration.type);
    }
    catch(error) {
      throw new _unhandledError({
        message: `Unable to instance configuration "${key}"`,
        code : [_moduleName, _moduleCodes.HandlerInstantiationFailed].join("/"),
        cause : error });
    }
    if (!handler) {
      throw new _unhandledError({
        message: `Constructor not found "${key}"`,
        code : [_moduleName, _moduleCodes.HandlerConstuctorNotFound].join("/"),
        cause : err });
    }
    _handlers[configuration.type] = handler;
  }
  return new handler(configuration, this.env);
};

module.exports = {
  Manager : DatabaseManager
};
