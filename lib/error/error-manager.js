/**
 * @file Source code for Error Manager.
 * @author Alvaro Juste
 */
"use strict";

// jaune
const _errors = require("./errors");

/**
 * @class Manages errors in the application.
 * @returns
 */
const ErrorManager = function () {};

/**
 * @function Converts an error into an not handled error if it is not.
 * @param    {any} err Object to test or cause
 * @param    {object} opts The options
 */
ErrorManager.prototype.asUnhandledError = function(err, opts) {

  if (!err) {
    return null;
  }

  opts = opts || {};

  return this.isUnhandledError(err) ? err : new _errors.UnhandledError({
    cause : err,
    message : opts.message,
    code : opts.code
  });
};

/**
 * @function Logs an unhandled error
 * @param    {Object} err The error
 * @param    {Object} logger The logging object
 * @param    {Object} [opts] The options for the logger.
 */
ErrorManager.prototype.logErrorOnUnhandledError = function* (err, logger, opts) {
  if (this.isUnhandledError(err)) {
    yield logger.logError(opts || {});
  }
};

/**
 * @function Validates if an error is unhandled
 * @param    {Object} err The error
 * @returns  {Boolean} True when unhandled
 */
ErrorManager.prototype.isUnhandledError = function(err) {
  return err instanceof _errors.UnhandledError;
};

ErrorManager.prototype.printWholeDetail = function(err, lineBreak) {

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
};
module.exports = {
  Manager : ErrorManager
};
