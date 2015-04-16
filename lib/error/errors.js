var modules = {
  _ : require("underscore")
};
/**
 * @file Source code for Unhandled Error.
 * @author Alvaro Juste
 */

/**
 *
 * @param opts
 * @returns
 */
function UnhandledError(opts) {
  this.cause = opts.cause;
  this.message = opts.message;
  this.code = opts.code;
}
jaune.common.extend(jaune, {
  error : {
    UnhandledError : UnhandledError,
    ArgumentError : ArgumentError
  }
}, false);
/**
 * @class Represents a call to a function with an invalid argument
 * @param msg The message
 */
function ArgumentError(msg) {
  UnhandledError.call(this, { message : modules._.isString(msg) ?
    msg : JSON.stringify(msg) });
}
ArgumentError.prototype = UnhandledError;

module.exports = {
	UnhandledError : UnhandledError,
	ArgumentError : ArgumentError
};
