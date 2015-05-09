/**
 * @file Source file for environment registration.
 * @author Alvaro Juste
 */

(function() {

  "use strict";

  var Instance = new process.app.configuration.environment();

  module.exports = {
    Environment : Instance
  };

})();
