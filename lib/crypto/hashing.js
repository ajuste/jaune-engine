/**
 * @file Source code for Hashing functions.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var Crypto = require("crypto");

  /**
   * @class Hashing manager
   * @param {String} args.encoding The encoding for the hash
   * @param {String} args.algorithm Desired algorithm
   */
  var Hashing = function (args) {
    this.encoding = args.encoding;
    this.hashing = Crypto.createHash(args.algorithm);
  };
  Hashing.prototype = {
    /**
     * @function Get digest for a string
     * @param {String} str The string
     * @return {String} The digest
     */
    digest : function(str) {
      this.hashing.update(str);
      return this.hashing.digest(this.encoding);
    },
    unload : function() {
      this.hashing = undefined;
      this.encoding = undefined;
    }
  };
  module.exports = {
    Hashing : Hashing
  };

})();
