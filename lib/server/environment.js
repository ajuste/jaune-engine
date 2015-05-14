/**
 * @file Source file for environment registration.
 * @author Alvaro Juste
 */

(function() {

  "use strict";

  var Instance;

  module.exports = {
    get : function() {
      return Instance;
    },
    init : function(config) {
      return (Instance = config.environment);
    }
  };

})();
