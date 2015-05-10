/**
 * @file Source file application
 * @author Alvaro Juste
 */

(function() {

  "use strict";

  /**
   * @class Application
   */
  var App = function() {};
  /**
   * prototype
   */
  App.prototype = {
    /**
     * @function Fulfills prerequisites for the server to work.
     */
    pre : function() {
      if (!process.env) {
        process.env = {};
      }
      process.env.type = "production";
      process.env.path = process.cwd();
      process.app = this;
    },
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
      this.server = new (require("express"))(this.configuration);
      this.server.init();
    },
    /**
     * @function Initialize the application.
     * @param {Object} configuration Application configuration
     */
    init : function(configuration) {
      this.configuration = configuration;
      this.pre();
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
})();
