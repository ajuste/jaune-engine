/**
 * @file Source code for Mail Manager.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var Environment = null;
  var Mailers     = {};
  var Reflection  = require("../utils/reflection").Reflection;

  /**
   * @class The mailer manager
   */
  var MailManager = function () {
    if (!Environment) {
      Environment = require("../server/environment").get();
    }
  };
  /**
   * Prototype
   */
  MailManager.prototype = {
    /**
     * @function Create a mailer
     * @param {String} mailerConfigName The mailer name key
     * @returns {Object} The mailer object
     * @throws {Error} When mailer is not found
     */
    createMailer : function(mailerConfigName) {

      if (typeof mailerConfigName !== "string") {
        throw new Error("Invalid mailer configuration name");
      }

      var mailerSettings = environment.getMail(mailerConfigName);

      if (!mailerSettings) {

        mailerSettings = environment.getMail(mailerConfigName);

        if (!mailerSettings) {
          throw new Error("Mailer configuration not found");
        }
        settings[mailerConfigName] = mailerSettings;
      }
      if (!Mailers[mailerConfigName]) {
        Mailers[mailerConfigName] = Reflection.createInstance(mailerSettings.type, [mailerSettings]);
      }
      if (!Mailers[mailerConfigName]) {
        throw new Error("Mailer constructor not found: " + mailerSettings.type);
      }
      return Mailers[mailerConfigName];
    }
  };
  module.exports = {
    MailManager : new MailManager()
  };
})();
