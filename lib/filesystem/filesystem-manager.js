/**
 * @file Source code for file system manager.
 * @author Alvaro Juste <juste.alvaro@gmail.com>
 */
(function() {

  "use strict";

  var Environment = null;
  var Reflection  = require("../utils/reflection").Reflection;
  var Modules     = {};
  var Enums       = {
    ReadResult : {
      Success : 0,
      InvalidPath : 1,
      NotFound : 2,
      InvalidResourceType : 3,
      NotModified : 4
    }
  };
  /**
   * @class File system manager.
   */
  var FileSystemManager = function() {
    if (!Environment) {
      Environment = require("../server/environment").get();
    }
  };
  /**
   * Prototype
   */
  FileSystemManager.prototype = {
    /**
     * @function Get module by key
     * @param {String} key The module key
     * @returns {Object} The module
     */
    getModule : function(key) {

      var connection = null;

      if (!Modules[key]) {
        connection = Environment.getFileSystemConnection(key);
        Modules[key] = Reflection.createInstance(connection.type, [connection]);
      }
      return Modules[key];
    },
    /**
    * @function Read a file
    * @param {Object} module Module that is going to read
    * @param {Object} args Arguments
    * @param {Fucntion} cb Callback
    */
    read : function(module, args, cb) {

      var fstat = null;

      /**
       * @callback On check file exists
       * @param {Boolean} exists Exist flag
       */
      function onExists(exists) {
        if (!exists) {
          cb(undefined, Enums.ReadResult.NotFound);
        }
        else {
          module.stat(args.path, onStat);
        }
      }
      /**
       * @callback On file stat
       * @param {*} [err] Possible error
       * @param {Object} [stat] The stat
       */
      function onStat(err, stat) {
        fstat = stat;
        /**
         * @callback On check cache
         * @param {*} [err] Possible error
         * @param {Boolean} [hit] Hit flag
         */
        function onCacheCheck(err, hit) {
          if (err) {
            cb(err);
          }
          else  if (hit === false) {
            module.readFile(args.path, onReadFile);
          }
          else {
            cb(undefined, Enums.ReadResult.NotModified, undefined);
          }
        }
        if (err) {
          cb(err);
        }
        else if (stat.isDirectory()){
          cb(undefined, Enums.ReadResult.InvalidResourceType);
        }
        else if ("function" === typeof args.checkCache){
          args.checkCache(stat, onCacheCheck);
        }
        else {
          onCacheCheck(false);
        }
      }
      /**
       * @callback On read file
       * @param {*} [err] Possible error
       * @param {Stream} [stream] The stream
       */
      function onReadFile(err, stream) {
        if (err) {
          cb(err);
        }
        else {
          cb(undefined, Enums.ReadResult.Success, stream, fstat);
        }
      }
      if (args.path.indexOf("./") !== -1) {
        cb(undefined, Enums.ReadResult.InvalidPath);
      }
      else {
        module.exists(args.path, onExists);
      }
    }
  };
  module.exports = {
    Manager : new FileSystemManager(),
    ReadResult : Enums.ReadResult
  };
})();
