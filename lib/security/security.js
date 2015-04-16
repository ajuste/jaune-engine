/**
 * @file Source code for Security Manager.
 * @author Alvaro Juste
 */
var modules = {
  errorManager : new jaune.error.ErrorManager(),
  validator : new jaune.common.Validator(),
  uuid : new jaune.common.UUID(),
  loggingManager : new jaune.logging.LoggingManager()
}, logger = {
  core : null
}, enums = {
  /**
   * Login trust level
   *
   * @enumeration
   * @readonly
   * @enum {Number}
   * @name {jaune.app.security.LoginTrustLevel} <b>Don't change ordinal.</b>
   */
  LoginTrustLevel : {
    /**
     * Low trust level
     *
     * @type {Number}
     */
    Low : 0,
    /**
     * High trust level
     *
     * @type {Number}
     */
    Full : 1
  },
  /**
   * Result for isGranted operation
   *
   * @enumeration
   * @readonly
   * @enum {Number}
   * @name {jaune.security.IsGrantedResult}
   * @remark Do not change ordinals as many functions depends on this
   */
  IsGrantedResult : {
    /**
     * Not granted
     *
     * @constant {number}
     */
    No : 0,
    /**
     * Insufficient trust level.
     *
     * @constant {number}
     */
    InsufficientTrustLevel : 1,
    /**
     * Granted
     *
     * @constant {number}
     */
    Yes : 2
  },
  /**
   * Defines actions on an entity
   *
   * @enumeration
   * @readonly
   * @enum {Number}
   * @name {jaune.app.security.Action}
   */
  Action : {
    /**
     * Create action.
     *
     * @constant {number}
     */
    Create : 0,
    /**
     * Modify action.
     *
     * @constant {number}
     */
    Modify : 1,
    /**
     * Remove action.
     *
     * @constant {number}
     */
    Remove : 2,
    /**
     * Read action.
     *
     * @constant {number}
     */
    Read : 3,
    /**
     * Change status action.
     *
     * @constant {number}
     */
    StatusChange : 4,
    /**
     * Get list action.
     *
     * @constant {number}
     */
    List : 5,
    /**
     * Special for checking permissions
     *
     * @constant {number}
     */
    Permission : 6
  }
};
var ModuleName = 'app/security';
var idCheckers = {}, handlers = {};
/**
 * Checks for session requirements on authentication and login trust.
 *
 * @param {Object} session Session.
 * @param {Number} [minimumLoginTrust] Minimum login trust.
 * @returns {jaune.security.IsGrantedResult} Verification
 */
function checkSession(session, minimumLoginTrust) {

  if (true !== session.auth) {
    return jaune.security.IsGrantedResult.No;
  }
  else if ("number" === typeof minimumLoginTrust && session.trustLevel < minimumLoginTrust) {
    return jaune.security.IsGrantedResult.InsufficientTrustLevel;
  }
  else {
    return jaune.security.IsGrantedResult.Yes;
  }
}
/**
 * Checks for session requirements on authentication and login trust.
 *
 * @param {Object} session Session.
 * @param {Number} [minimumLoginTrust] Minimum login trust.
 * @returns {Boolean} True if requirements have been fulfilled.
 */
function checkLoginId(whoType, session, targetId) {

  if ("function" !== typeof idCheckers[whoType]) {
    throw new Error("Invalid id checker: " + whoType);
  }
  return idCheckers[whoType](session, targetId);
}
/**
 * @class Handles security related operations.
 * @constructor
 * @name {jaune.security.SecurityManager}
 */
function SecurityManager() {
  if (null === logger.core) {
    logger.core = modules.loggingManager.instance('core');
  }
}
/**
 * Module prototype
 */
SecurityManager.prototype = {
  checkSession : checkSession,
  checkLoginId : checkLoginId,
  /**
   * Adds a security handler
   *
   * @function
   * @param {String} name Name of handler
   * @param {Function} checker Checker
   */
  addIdCheckers : function(name, checker) {
    if (!modules.validator.checkStringLength(name, 1024)) {
      throw new Error("name");
    }
    else if ("function" !== typeof checker) {
      throw new Error("checker");
    }
    else if (idCheckers[name]) {
      throw new Error("Id checker already defined: " + name);
    }
    else {
      idCheckers[name] = checker;
    }
  },
  /**
   * Adds a security handler
   *
   * @function
   * @param {String} name Name of handler
   * @param {Function} handler Handler
   */
  addHandler : function(name, handler) {
    if (!modules.validator.checkStringLength(name, 1024)) {
      throw new Error("name");
    }
    else if ("function" !== typeof handler) {
      throw new Error("handler");
    }
    else if (handlers[name]) {
      throw new Error("Handler already defined: " + name);
    }
    else {
      handlers[name] = handler;
    }
  },
  /**
   * Validate if someone is granted to do some action over something.
   *
   * @function
   * @param {jaune.security.Action} parameters.action The action to be performed
   * @param {UUID} parameters.whoId Who is performing action id
   * @param {String} parameters.whoType Describes the type of whoId.
   * @param {UUID} parameters.whatId The object over what is the action being
   * performed.
   * @param {String} parameters.whatType Describes the type of whatId.
   * @param {Object} parameters.session The session that is currently active
   * @throws {Error} When no handler for object type which action is being
   * performed.
   * @returns {Boolean} True when granted. False otherwise.
   */
  isGranted : function(parameters) {

    var handler = null;

    if (!modules.validator.isNumber(parameters.action, 0)) {
      throw new Error("parameters.action");
    }
    else if (!modules.validator.checkStringLength(parameters.whoId, 12) && 
             !modules.validator.isNumber(parameters.whoId, 0) &&
             !modules.validator.isUUID(parameters.whoId)) {
      throw new Error("parameters.whoId");
    }
    else if (!modules.validator.checkStringLength(parameters.whoType, 1024)) {
      throw new Error("parameters.whoType");
    }
    else if (!modules.validator.isNumber(parameters.whatId, 0) && !modules.validator.isUUID(parameters.whatId) && !modules.validator.checkStringLength(parameters.whatId, 1024)) {
      throw new Error("parameters.whatId");
    }
    else if (!modules.validator.checkStringLength(parameters.whatType, 1024)) {
      throw new Error("parameters.whatType");
    }
    else if (!modules.validator.isObject(parameters.session, false, false)) {
      throw new Error("parameters.session");
    }
    else if (!modules.validator.isFunction(handler = handlers[parameters.whatType])) {
      throw new Error("Unsupported handler for whatType: " + parameters.whatType);
    }
    else {
      return handler(parameters);
    }
  }
};
jaune.common.extend(jaune, {
  security : {
    SecurityManager : SecurityManager,
    Action : enums.Action,
    LoginTrustLevel : enums.LoginTrustLevel,
    IsGrantedResult : enums.IsGrantedResult
  }
}, false);
