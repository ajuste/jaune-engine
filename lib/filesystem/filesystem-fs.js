/**
 * @file   NodeJS module that implements file system handler based on local file system.
 * @author Alvaro Juste <juste.alvaro@gmail.com>
 */
(function() {

  "use strict";

  const _      = require("underscore");
  const Mime   = require("mime");
  const Ncp    = require("ncp");
  const Path   = require("path");
  const Fs     = require("fs");
  const Q      = require("q");
  const Stream = require("stream");

  /**
   * @function Convert to absolute path
   * @param    {String} path The path
   * @returns  {String} Converted path
   */
  function convertPathToAbsolute(path) {
    return Path.join(process.env.path, path);
  }
  /**
   * @class File system constructor.
   * @param {object} connection Accepts the connection to the file system.
   */
  var FSFileSystem = function(connection) {
    this.connection = connection;
  };
  /**
   * Prototype
   */
  FSFileSystem.prototype = {
    /**
     * @function Writes a file into file system.
     * @param    {String} path Where to write
     * @param    {Buffer|String|Stream} data Data to be written into file.
     * @param    {Boolean} [options.absolute] When true the path is not converted to absolute.
     */
    writeFile : function* (path, data, options) {

      options = _.defaults(options || {}, {
        absolute : false
      });
      path = options.absolute ? path : convertPathToAbsolute(path);

      if (data instanceof Stream) {
        const defer = Q.defer();
        const write = Fs.createWriteStream(path);
        
        data
        .on("end", defer.resolve)
        .on("error", defer.reject);

        write.on("open", function() {
          data.pipe(write);
        })
        .on("error", defer.reject);

        return defer.promise;
      }
      else {
        return Q.nfcall(Fs.writeFile, convertPathToAbsolute(path), data);
      }
    },
    /**
     * @function Reads a file at the given path.
     * @param    {String} path The path to read file from.
     * @param    {String} [options.encoding] The encoding of the file
     * @param    {Boolean} [options.absolute] When true the path is not converted to absolute.
     */
    readFile : function* (path, options) {

      options = _.defaults(options || {}, {
        encoding : "binary",
        absolute : false
      });
      path = options.absolute ? path : convertPathToAbsolute(path);

      if (options.encoding === "binary") {
        if (!(yield this.exists(path))) {
          throw new Error("file does not exists");
        };
        return Fs.createReadStream(path);
      }
      else {
        return Q.nfcall(Fs.readFile, path, options.encoding);
      }
    },
    /**
     * @function Checks if file exists.
     * @param    {path} string The path to file.
     * @param    {function} cb Callback accepting flag parameter indicating the existence of the requested path.
     */
    exists : function* (path, cb) {
      return Q.bind(Fs.exists, Fs, convertPathToAbsolute(path));
    },
    /**
     * @function Copies a path into another.
     * @param    {from} string The source path.
     * @param    {to} string The destination path.
     */
    copy : function* (from, to) {
      return Q.nfcall(Ncp, convertPathToAbsolute(from), convertPathToAbsolute(to));
    },
    /**
     * @function Removes a file
     * @param    {String} path The file to be removed
     * @param    {Boolean} [options.absolute] When true the path is not converted to absolute.
     */
    removeFile : function* (path, options) {

      options = _.defaults(options || {}, {
        absolute : false
      });
      path = options.absolute ? path : convertPathToAbsolute(path);
      return Q.nfcall(Fs.unlink, path);
    },
    /**
     * @function Retrieves the STAT object for a specified path.
     * @param {path} string The source path.
     * @param {function} cb Standard callback function.
     */
    stat : function* (path, cb) {
      const defer = Q.defer();
      Fs.stat(convertPathToAbsolute(path), function(err, stat) {
        if (err) {
          defer.reject(err);
        }
        defer.resolve(stat ? new FSClientStat(path, stat) : null);
      });
      return yield defer.promise;
    }
  };
  /**
   * @class Local file system STAT object wrapper.
   * @param {object} connection Accepts the connection to the file system.
   * @param {string} path The path of the STAT object.
   */
  var FSClientStat = function(path, stat) {
    this.stat = stat;
    this.path = path;
    this.mtime = this.stat.mtime;
    this.size = this.stat.size;
  };
  /**
   * Prototype
   */
  FSClientStat.prototype = {
    /**
     * @function Checks if STAT is a directory.
     */
    isDirectory : function() {
      return this.stat.isDirectory();
    },
    /**
     * @function Returns the MIME type of file.
     */
    getMime : function() {
      return this.isDirectory() ? "" : Mime.lookup(convertPathToAbsolute(this.path));
    }
  };
  module.exports = {
    FsClient : FSFileSystem
  };
})();
