/**
 * @file   Source code for Database Manager.
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _isUndefined = require("lodash").isUndefined;

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
const DB_CONFIG_SECTION = "db";

/**
 * @class Data base manager
 * @param {Object} env Environment
 */
const DatabaseManager = function(env) {
  this.settings = env.getEnvProperty(DB_CONFIG_SECTION);
};

/**
 * @function Get client from configuration
 * @param    {String} key The key
 * @returns  {Object} The client
 */
DatabaseManager.prototype.getClientFromConfiguration = function(key) {

  let   handler = null;
  const configuration = this.settings(key);

  if (_isUndefined(configuration)) {
    throw new _unhandledError({
      message: `Connection not found "${key}"`,
      code : _moduleName  + _moduleCodes.ConfigurationNotFound });
  }
  //  try to get handler if loaded, if not load it.
  handler = __handlers[configuration.type];

  if (_isUndefined(handler)) {

    try {
      handler = _reflection.evaluateName(configuration.type);
    }
    catch(error) {
      throw new _unhandledError({
        message: `Unable to instance configuration "${key}"`,
        code : _moduleName  + _moduleCodes.HandlerInstantiationFailed,
        cause : error });
    }
    if (!handle) {
      throw new _unhandledError({
        message: `Constructor not found "${key}"`,
        code : _moduleName  + _moduleCodes.HandlerConstuctorNotFound,
        cause : err });
    }
    _handlers[configuration.type] = handler;
  }
  return new handler(configuration, this.env);
};

module.exports = {
  Manager : DatabaseManager
};
