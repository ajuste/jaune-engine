/**
 * @file Source code for Hashing functions.
 * @author Alvaro Juste
 */
"use strict";

const _crypto = require("crypto");

/**
 * @class Hashing manager
 * @param {String} args.encoding The encoding for the hash
 * @param {String} args.algorithm Desired algorithm
 */
const Hashing = function (args) {
  if (!args || !args.algorithm) return;
  this.encoding = args.encoding;
  this.hashing  = _crypto.createHash(args.algorithm);
};

/**
 * @function Get digest for a string
 * @param    {String} str The string
 * @return   {String} The digest
 */
Hashing.prototype.digest = function(str) {
  this.hashing.update(str);
  return this.hashing.digest(this.encoding);
};

Hashing.prototype.unload = function() {
  this.hashing = undefined;
  this.encoding = undefined;
};

module.exports = {
  Hashing : Hashing
};
