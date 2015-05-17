/**
 * @file Source code for Security Manager.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var Validator      = require("../utils/validator").Validator;
  var ModuleName     = "app/security";
  var IdCheckers     = {};
  var Handlers       = {};
  var Enums          = {
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
   * @function Checks for session requirements on authentication and login trust.
   * @param {Object} session Session.
   * @param {Number} [minimumLoginTrust] Minimum login trust.
   * @returns {security.IsGrantedResult} Verification
   */
  function checkSession(session, minimumLoginTrust) {

    if (true !== session.auth) {
      return Enums.IsGrantedResult.No;
    }
    else if ("number" === typeof minimumLoginTrust && session.trustLevel < minimumLoginTrust) {
      return Enums.IsGrantedResult.InsufficientTrustLevel;
    }
    else {
      return Enums.IsGrantedResult.Yes;
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

    if ("function" !== typeof IdCheckers[whoType]) {
      throw new Error("Invalid id checker: " + whoType);
    }
    return IdCheckers[whoType](session, targetId);
  }
  /**
   * @class Handles security related operations.
   */
  var SecurityManager = function() {};
  /**
   * Module prototype
   */
  SecurityManager.prototype = {
    checkSession : checkSession,
    checkLoginId : checkLoginId,
    /**
     * @function Adds a security handler
     * @param {String} name Name of handler
     * @param {Function} checker Checker
     */
    addIdCheckers : function(name, checker) {
      if (!Validator.checkStringLength(name, 1024)) {
        throw new Error("name");
      }
      else if ("function" !== typeof checker) {
        throw new Error("checker");
      }
      else if (IdCheckers[name]) {
        throw new Error("Id checker already defined: " + name);
      }
      else {
        IdCheckers[name] = checker;
      }
    },
    /**
     * @function Adds a security handler
     * @param {String} name Name of handler
     * @param {Function} handler Handler
     */
    addHandler : function(name, handler) {
      if (!Validator.checkStringLength(name, 1024)) {
        throw new Error("name");
      }
      else if ("function" !== typeof handler) {
        throw new Error("handler");
      }
      else if (Handlers[name]) {
        throw new Error("Handler already defined: " + name);
      }
      else {
        Handlers[name] = handler;
      }
    },
    /**
     * @function Validate if someone is granted to do some action over something.
     * @param {Action} parameters.action The action to be performed
     * @param {UUID} parameters.whoId Who is performing action id
     * @param {String} parameters.whoType Describes the type of whoId.
     * @param {UUID} parameters.whatId The object over what is the action being performed.
     * @param {String} parameters.whatType Describes the type of whatId.
     * @param {Object} parameters.session The session that is currently active
     * @throws {Error} When no handler for object type which action is being performed.
     * @returns {Boolean} True when granted. False otherwise.
     */
    isGranted : function(parameters) {
      
      var handler = null;

      if (!Validator.isNumber(parameters.action, 0)) {
        throw new Error("parameters.action");
      }
      else if (!Validator.checkStringLength(parameters.whoId, 12) &&
               !Validator.isNumber(parameters.whoId, 0) &&
               !Validator.isUUID(parameters.whoId)) {
        throw new Error("parameters.whoId");
      }
      else if (!Validator.checkStringLength(parameters.whoType, 1024)) {
        throw new Error("parameters.whoType");
      }
      else if (!Validator.isNumber(parameters.whatId, 0) && !Validator.isUUID(parameters.whatId) && !Validator.checkStringLength(parameters.whatId, 1024)) {
        throw new Error("parameters.whatId");
      }
      else if (!Validator.checkStringLength(parameters.whatType, 1024)) {
        throw new Error("parameters.whatType");
      }
      else if (!Validator.isObject(parameters.session, false, false)) {
        throw new Error("parameters.session");
      }
      else if (!Validator.isFunction(handler = Handlers[parameters.whatType])) {
        throw new Error("Unsupported handler for whatType: " + parameters.whatType);
      }
      else {
        return handler(parameters);
      }
    }
  };
  module.exports = {
    Manager : new SecurityManager(),
    Action : Enums.Action,
    LoginTrustLevel : Enums.LoginTrustLevel,
    IsGrantedResult : Enums.IsGrantedResult
  };
})();
