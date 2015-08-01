/**
 * @file Source code for Error Manager.
 * @author Alvaro Juste
 */

(function() {

  "use strict";

  var Errors   = require("./errors");
  /**
   * @class Manages errors in the application.
   * @returns
   */
  var ErrorManager = function () {};
  /**
   * Error manager prototype.
   */
  ErrorManager.prototype = {
    /**
     * Converts an error into an not handled error if it is not.
     *
     * @param {any} err Object to test or cause
     * @param {object} opts The options
     */
    asUnhandledError : function(err, opts) {

      if (!err) {
        return null;
      }

      opts = opts || {};

      return this.isUnhandledError(err) ? err : new Errors.UnhandledError({
        cause : err,
        message : opts.message,
        code : opts.code
      });
    },
    /**
     * @function Logs an unhandled error
     * @param {Object} err The error
     * @param {Object} logger The logging object
     * @param {Object} [opts] The options for the logger.
     */
    logErrorOnUnhandledError : function* (err, logger, opts) {

      if (this.isUnhandledError(err)) {
        yield logger.logError(opts || {});
      }
    },
    /**
     * @function Validates if an error is unhandled
     * @param {Object} err The error
     * @returns {Boolean} True when unhandled
     */
    isUnhandledError : function(err) {
      return err instanceof Errors.UnhandledError;
    },
    printWholeDetail : function(err, lineBreak) {

      var result = "";

      lineBreak = lineBreak || "\n";

      while(err) {
        if (err.message) {
          result += "Message: ";
          result += err.message;
          result += lineBreak;
        }
        if (err.stack) {
          result += "Stack trace: ";
          result += err.stack;
          result += lineBreak;
        }
        err = err.cause;
      }
      return result;
    }
  };
  module.exports = {
    Manager : new ErrorManager()
  };

})();
