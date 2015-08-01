/**
 * @file   NodeJS module that implements file system handler based on DROPBOX system.
 * @author Alvaro Juste <juste.alvaro@gmail.com>
 */
(function() {

  "use strict";

  const Dropbox         = require("dropbox");
  const Path            = require("Path");
  const WriteReadStream = require("../utils/streams").WriteReadStream;
  const Q               = require("q");

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
     * @param    {path} string The path to write file to.
     * @param    {object} options Collection of options.
     * @param    {Buffer} data Data to be written into file.
     */
    writeFile : function* (path, options, data) {
      yield Q.nbind(this.dbClient.writeFile, this.dbClient, path, data, options);
    },
    /**
     * @function Reads a file at the given path.
     * @param    {path} string The path to read file from.
     */
    readFile : function* (path) {

      const data =  yield (Q.nbind(this.dbClient.readFile, this.dbClient, path, { binary : true }));
      const stream = new WriteReadStream();

      stream.write(new Buffer(data, "binary"));
      stream.end();

      return stream;
    },
    /**
     * @function Checks if file exists.
     * @param    {pathTo} string The path to file.
     */
    exists : function* (pathTo) {
      const data = yield (Q.nbind(this.dbClient.search,
                                  this.dbClient,
                                  modules.path.dirname(pathTo),
                                  modules.path.basename(pathTo), {
                                    file_limit : 1,
                                    include_deleted : false
                                  }));
      return data.length !== 0;
    },
    /**
     * @function Copies a path into another.
     * @param    {from} string The source path.
     * @param    {to} string The destination path.
     */
    copy : function* (from, to) {
      return (yield Q.nbind(this.dbClient.copy, this.dbClient, from, to));
    },
    /**
     * @function Retrieves the STAT object for a specified path.
     * @param    {path} string The source path.
     */
    stat : function* (path) {
      const metadata =  yield Q.nbind(this.dbClient.metadata,
                                      this.dbClient, path, {
                                        list : false
                                      });
      return new DropboxClientStat(path, metadata);
    },
    /**
     * @function Retrieves the path relative to the file system.
     * @param    {path} string The source path.
     */
    getPath : function(pathTo) {
      return pathTo;
    },
    /**
     * @function Request a token.
     */
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
