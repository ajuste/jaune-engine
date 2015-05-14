/**
 * @file Source file application
 * @author Alvaro Juste
 */

(function() {

  "use strict";

  var require       = _require();
  var ExpressServer = require("/lib/server/express");

  /**
   * @class Application
   */
  var App = function() {
    if (!process.env) {
      process.env = {};
    }
    process.env.type = "production";
    process.env.path = process.cwd();
    process.app = this;
  };
  /**
   * prototype
   */
  App.prototype = {
    /**
     * @function Parses arguments from command line that are directed to this class.
     */
    parseArguments : function() {
      for(var i = 0; i < process.argv.length; i++) {
        switch(process.argv[i]) {
          case "--develop" :
            process.env.type = "development";
          break;
        }
      }
    },
    /**
     * @function Starts the server.
     */
    startServer : function() {
      (this.server = new ExpressServer(this.configuration)).init();
    },
    /**
     * @function Initialize the application.
     * @param {Object} configuration Application configuration
     */
    init : function(configuration) {
      this.configuration = configuration;
      this.parseArguments();
      this.configuration.init.loadStatic();
      this.startServer();
    },
    /**
     * @function Unload application
     */
    unload : function() {
      process.env = null;
      process.app = null;
    }
  };
  module.exports = App;

  if (process.testing) {
    App.mocking = {
      ServerExpressServer : ExpressServer
    };
  }
})();
