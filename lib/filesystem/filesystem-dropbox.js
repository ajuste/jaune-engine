/**
 * @file NodeJS module that implements file system handler based on DROPBOX system.
 * @author Alvaro Juste <juste.alvaro@gmail.com>
 */
(function() {

  "use strict";

  var Dropbox         = require("dropbox");
  var Path            = require("Path");
  var WriteReadStream = require("../utils/streams").WriteReadStream;

  /**
   * @class Dropbox file system client constructor.
   * @param {Object} connection Accepts the connection to the file system.
   */
  var DropboxClient = function(connection) {
    this.dbClient = new Dropbox.Client(connection);
  };
  /**
  * Prototype
  */
  DropboxClient.prototype = {
    /**
     * @function Writes a file into file system.
     * @param {path} string The path to write file to.
     * @param {object} options Collection of options.
     * @param {Buffer} data Data to be written into file.
     * @param {function} cb Standard callback function.
     */
    writeFile : function(path, options, data, cb) {
      this.dbClient.writeFile(path, data, options, function(err, stat) {
        cb(err);
      });
    },
    /**
     * @function Reads a file at the given path.
     * @param {path} string The path to read file from.
     * @param {function} cb Standard callback function. Second parameter will be a read stream.
     */
    readFile : function(path, cb) {
      this.dbClient.readFile(path, {
        binary : true
      }, function(error, data) {
        var
        s = null;

        if (!error) {
          s = new WriteReadStream();
        }
        cb(error, s);

        if (!error) {
          s.write(new Buffer(data, "binary"));
          s.end();
        }
      });
    },
    /**
     * @function Checks if file exists.
     * @param {pathTo} string The path to file.
     * @param {function} cb Callback accepting flag parameter indicating the existence of the requested path.
     */
    exists : function(pathTo, cb) {
      this.dbClient.search(modules.path.dirname(pathTo), modules.path.basename(pathTo), {
        file_limit : 1,
        include_deleted : false
      }, function(err, data) {
        cb(!err && data.length !== 0);
      });
    },
    /**
     * @function Copies a path into another.
     * @param {from} string The source path.
     * @param {to} string The destination path.
     * @param {function} cb Standard callback function.
     */
    copy : function(from, to, cb) {
      this.dbClient.copy(from, to, function(err, stat) {
        cb(err, stat);
      });
    },
    /**
     * @function Retrieves the STAT object for a specified path.
     * @param {path} string The source path.
     * @param {function} cb Standard callback function.
     */
    stat : function(path, cb) {
      this.dbClient.metadata(path, {
        list : false
      }, function (err, metadata) {
        cb(err, err ? undefined : new DropboxClientStat(path, metadata));
      });
    },
    /**
     * @function Retrieves the path relative to the file system.
     * @param {path} string The source path.
     */
    getPath : function(pathTo) {
      return pathTo;
    },
    requestToken : function() {
      throw "Not supported";
    }
  };
  /**
   * @class Dropbox system STAT object wrapper.
   * @param {string} path The path.
   * @param {object} metadata Path meta data.
   */
  var DropboxClientStat = function(path, metadata) {
    this.metadata = metadata;
    this.path = path;
    this.mtime = this.metadata._json.modified;
    this.size = this.metadata.size;
  };
  /**
  * Prototype
  */
  DropboxClientStat.prototype = {
    /**
     * Checks if STAT is a directory.
     */
    isDirectory : function() {
      return this.metadata.is_dir;
    },
    /**
     * Returns the MIME type of file.
     */
    getMime : function() {
      return this.metadata.isFile ? this.metadata.mimeType : "";
    }
  };
  module.exports = {
    DropboxClient : DropboxClient
  };
})();
