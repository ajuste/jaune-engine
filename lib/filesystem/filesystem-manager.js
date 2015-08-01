/**
 * @file Source code for file system manager.
 * @author Alvaro Juste <juste.alvaro@gmail.com>
 */
(function() {

  "use strict";

  var _           = require('underscore');
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
    * @function Gets result for reading
    * @param    {Number} code Error code
    * @param    {Stream} stream The stream
    * @param    {Object} stat File stat
    */
    __getReadResult : function(code, stream, stat) {
      return { code : code, stream : stream, stat : stat };
    },
    /**
    * @function Read a file
    * @param {Object} module Module that is going to read
    * @param {Object} args Arguments
    */
    read : function* (module, args) {

      let fstat = null;

      if (args.path.indexOf("./") !== -1) {
        return this.__getReadResult(Enums.ReadResult.InvalidPath)
      }
      if (!(yield module.exists(args.path))) {
        return this.__getReadResult(Enums.ReadResult.NotFound);
      }
      fstat = yield module.stat(args.path);

      if (fstat.isDirectory()){
        return this.__getReadResult(Enums.ReadResult.InvalidResourceType);
      }
      if (_.isFunction(args.checkCache) && args.checkCache(fstat)) {
        return this.__getReadResult(Enums.ReadResult.NotModified);
      }
      return this.__getReadResult(Enums.ReadResult.Success, (yield module.readFile(args.path)), fstat);
    }
  };
  module.exports = {
    Manager : new FileSystemManager(),
    ReadResult : Enums.ReadResult
  };
})();
