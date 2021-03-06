/**
 * @file   Source code for Security Manager.
 * @author Alvaro Juste
 */
"use strict";

const _validator  = require("jaune-util").Validator;
const _idCheckers = {};
const _handlers   = {};
const _enums      = {
  /**
   * @enumeration Login trust level
   * @readonly
   * @enum {Number}
   */
  LoginTrustLevel : {
    /**
     * @type {Number} Low trust level
     */
    Low : 0,
    /**
     * @type {Number} High trust level
     */
    Full : 1
  },
  /**
   * @enumeration Result for isGranted operation
   * @readonly
   * @enum {Number}
   * @remark Do not change ordinals as many functions depends on this
   */
  IsGrantedResult : {
    /**
     * @constant {number} Not granted
     */
    No : 0,
    /**
     * Insufficient trust level.
     *
     * @constant {number}
     */
    InsufficientTrustLevel : 1,
    /**
     * @constant {number} Granted
     */
    Yes : 2
  },
  /**
   * @enumeration Defines actions on an entity
   * @readonly
   * @enum {Number}
   */
  Action : {
    /**
     * @constant {number} Create action.
     */
    Create : 0,
    /**
     * @constant {number} Modify action.
     */
    Modify : 1,
    /**
     * @constant {number} Remove action.
     */
    Remove : 2,
    /**
     * @constant {number} Read action.
     */
    Read : 3,
    /**
     * @constant {number} Change status action.
     */
    StatusChange : 4,
    /**
     * @constant {number} Get list action.
     */
    List : 5,
    /**
     * @constant {number} Special for checking permissions
     */
    Permission : 6
  }
};
/**
 * @class Handles security related operations.
 */
const SecurityManager = function() {};

/**
 * @function Checks for session requirements on authentication and login trust.
 * @param    {Object} session Session.
 * @param    {Number} [minimumLoginTrust] Minimum login trust.
 * @returns  {security.IsGrantedResult} Verification
 */
SecurityManager.prototype.checkSession = function(session, minimumLoginTrust) {

  if (true !== session.auth) {
    return _enums.IsGrantedResult.No;
  }
  if ("number" === typeof minimumLoginTrust && session.trustLevel < minimumLoginTrust) {
    return _enums.IsGrantedResult.InsufficientTrustLevel;
  }
  return _enums.IsGrantedResult.Yes;
};

/**
 * Checks for session requirements on authentication and login trust.
 *
 * @param   {Object} session Session.
 * @param   {Number} [minimumLoginTrust] Minimum login trust.
 * @returns {Boolean} True if requirements have been fulfilled.
 */
SecurityManager.prototype.checkLoginId = function(whoType, session, targetId) {
  if ("function" !== typeof _idCheckers[whoType]) {
    throw new Error("Invalid id checker: " + whoType);
  }
  return _idCheckers[whoType](session, targetId);
};

/**
 * @function Adds a security handler
 * @param    {String} name Name of handler
 * @param    {Function} checker Checker
 */
 SecurityManager.prototype.addIdCheckers = function(name, checker) {
  if (!_validator.checkStringLength(name, 1024)) {
    throw new Error("name");
  }
  else if ("function" !== typeof checker) {
    throw new Error("checker");
  }
  else if (_idCheckers[name]) {
    throw new Error("Id checker already defined: " + name);
  }
  else {
    _idCheckers[name] = checker;
  }
};

/**
 * @function Adds a security handler
 * @param    {String} name Name of handler
 * @param    {Function} handler Handler
 */
 SecurityManager.prototype.addHandler = function(name, handler) {
  if (!_validator.checkStringLength(name, 1024)) {
    throw new Error("name");
  }
  else if ("function" !== typeof handler) {
    throw new Error("handler");
  }
  else if (_handlers[name]) {
    throw new Error("Handler already defined: " + name);
  }
  else {
    _handlers[name] = handler;
  }
};

/**
 * @function Validate if someone is granted to do some action over something.
 * @param    {Action} parameters.action The action to be performed
 * @param    {UUID} parameters.whoId Who is performing action id
 * @param    {String} parameters.whoType Describes the type of whoId.
 * @param    {UUID} parameters.whatId The object over what is the action being performed.
 * @param    {String} parameters.whatType Describes the type of whatId.
 * @param    {Object} parameters.session The session that is currently active
 * @throws   {Error} When no handler for object type which action is being performed.
 * @returns  {Boolean} True when granted. False otherwise.
 */
 SecurityManager.prototype.isGranted = function(parameters) {

  var handler = null;

  if (!_validator.isNumber(parameters.action, 0)) {
    throw new Error("parameters.action");
  }
  if (!_validator.checkStringLength(parameters.whoId, 12) &&
           !_validator.isNumber(parameters.whoId, 0) &&
           !_validator.isUUID(parameters.whoId)) {
    throw new Error("parameters.whoId");
  }
  if (!_validator.checkStringLength(parameters.whoType, 1024)) {
    throw new Error("parameters.whoType");
  }
  if (!_validator.isNumber(parameters.whatId, 0) && !_validator.isUUID(parameters.whatId) && !_validator.checkStringLength(parameters.whatId, 1024)) {
    throw new Error("parameters.whatId");
  }
  if (!_validator.checkStringLength(parameters.whatType, 1024)) {
    throw new Error("parameters.whatType");
  }
  if (!_validator.isObject(parameters.session, false, false)) {
    throw new Error("parameters.session");
  }
  if (!_validator.isFunction(handler = _handlers[parameters.whatType])) {
    throw new Error("Unsupported handler for whatType: " + parameters.whatType);
  }
  return handler(parameters);
};

module.exports = {
  Manager         : SecurityManager,
  Action          : _enums.Action,
  LoginTrustLevel : _enums.LoginTrustLevel,
  IsGrantedResult : _enums.IsGrantedResult
};
