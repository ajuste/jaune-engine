/**
 * @file NodeJS module that implements file system handler based on local file system.
 * @author Alvaro Juste <juste.alvaro@gmail.com>
 */
(function() {

  "use strict";

  var Mime = require("mime");
  var Ncp  = require("ncp");
  var Path = require("path");
  var Fs   = require("fs");

  /**
   * @function Convert to absolute path
   * @param {String} path The path
   * @returns {String} Converted path
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
     * @param {path} string The path to write file to.
     * @param {object} options Collection of options.
     * @param {Buffer} data Data to be written into file.
     * @param {function} cb Standard callback function.
     */
    writeFile : function(path, options, data, cb) {

      FileSystem.writeFile(convertPathToAbsolute(path), data, function(err) {
        cb(err);
      });
    },
    /**
     * @function Reads a file at the given path.
     * @param {path} string The path to read file from.
     * @param {function} cb Standard callback function. Second parameter will be a read stream.
     */
    readFile : function(path, cb, opts) {

      var
      absolute = convertPathToAbsolute(path);

      opts = opts || {};
      opts.encoding = opts.encoding || "binary";

      if (opts.encoding === "binary") {
        this.exists(path, function(exists) {
          cb(!exists ? new Error("file does not exists)") : null, exists ? FileSystem.createReadStream(absolute) : null);
        });
      }
      else {
        FileSystem.readFile(absolute, opts.encoding, function(err, file) {
          cb(err, file);
        });
      }
    },
    /**
     * @function Checks if file exists.
     * @param {path} string The path to file.
     * @param {function} cb Callback accepting flag parameter indicating the existence of the requested path.
     */
    exists : function(path, cb) {
      FileSystem.exists(convertPathToAbsolute(path), function(exists) {
        cb(exists);
      });
    },
    /**
     * @function Copies a path into another.
     * @param {from} string The source path.
     * @param {to} string The destination path.
     * @param {function} cb Standard callback function.
     */
    copy : function(from, to, cb) {
      Ncp(convertPathToAbsolute(from), convertPathToAbsolute(to), cb);
    },
    /**
     * @function Retrieves the STAT object for a specified path.
     * @param {path} string The source path.
     * @param {function} cb Standard callback function.
     */
    stat : function(path, cb) {
      FileSystem.stat(convertPathToAbsolute(path), function(err, stat){
        cb(err, stat ? new FSClientStat(path, stat) : null);
      });
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
