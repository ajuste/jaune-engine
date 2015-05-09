/**
 * @file Source code for Unhandled Error.
 * @author Alvaro Juste
 */

(function() {

  "use strict";

  var _ = require("underscore");

  /**
   * @class Unhandled error class
   * @param opts
   * @returns
   */
  function UnhandledError(opts) {
    this.cause = opts.cause;
    this.message = opts.message;
    this.code = opts.code;
  }
  /**
   * @class Represents a call to a function with an invalid argument
   * @param msg The message
   */
  function ArgumentError(msg) {
    UnhandledError.call(this, { message : modules._.isString(msg) ?
      msg : JSON.stringify(msg) });
  }
  module.exports = {
    UnhandledError : UnhandledError,
    ArgumentError : ArgumentError
  };

})();
