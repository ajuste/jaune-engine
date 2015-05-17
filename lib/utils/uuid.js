/**
 * @file Source code for UUID.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var Uuid = require("node-uuid");
  /**
   * @class UUID handler
   */
  var UUID = function() {};
  UUID.prototype = {
    /**
     * @function Create a new uuid.
     * @param {Buffer} [buffer] Where to put the uuid
     * @returns {Buffer} The buffer with the uuid
     */
    create : function(buffer) {
      return Uuid.v4({}, buffer || new Buffer(16));
    },
    /**
     * @function Creates a new uuid in plain text as hexadecimal
     * @returns {String} The new uuid
     */
    plain : function() {
      return this.asPlain(this.create());
    },
    /**
     * @function Returns the uuid as plain text with specified encoding
     * @param {Buffer} uuid The uuid to print as text
     * @param {String} [encoding] The desired encoding. Will default to hex.
     * @returns {String} The new uuid as plain
     */
    asPlain : function(uuid, encoding) {
      return uuid.toString(encoding || "hex").replace(/-/g, "");
    },
    asV4 : function(val) {
      var value = val || this.create();
      return Uuid.unparse("string" === typeof val ? this.parse(val) : val);
    },
    /**
     * @function Parses a uuid string
     * @param {Buffer} [buffer] Where to put the uuid
     * @param {String} uuid The UUID string to be parsed
     * @returns {Buffer} The buffer with the uuid
     */
    parse : function(input, buffer) {
      return Uuid.parse(input, buffer || new Buffer(16));
    },
    /**
     * @function Evaluates if two uuid are equal
     * @param {Buffer} uuid1 First uuid.
     * @param {Buffer} uuid2 Second uuid.
     * @returns {Boolean} True when equal
     */
    equal : function(uuid1, uuid2) {
      return uuid1.toString().toLowerCase() === uuid2.toString().toLowerCase();
    },
    /**
     * @function Returns an empty uuid
     * @param {Buffer} [buffer] Where to put the uuid
     * @returns {Buffer} The buffer with the uuid
     */
    empty : function(buffer) {
      return parse("00000000-0000-0000-0000-000000000000", buffer);
    }
  };
  module.exports = {
    UUID : new UUID()
  };
})();
