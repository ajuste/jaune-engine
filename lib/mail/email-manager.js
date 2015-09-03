/**
 * @file Source code for Mail Manager.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  const Environment = require("../server/environment").get();//.getModulesSettings().http;
  const Mailers     = {};
  const Reflection  = require("../utils/reflection").Reflection;

  /**
   * @class The mailer manager
   */
  const MailManager = function () { };
  /**
   * Prototype
   */
  MailManager.prototype = {
    /**
     * @function Create a mailer
     * @param    {String} mailerConfigName The mailer name key
     * @returns  {Object} The mailer object
     * @throws   {Error} When mailer is not found
     */
    createMailer : function(mailerConfigName) {

      if (typeof mailerConfigName !== "string") {
        throw new Error("Invalid mailer configuration name");
      }

      var mailerSettings = Environment.getMail(mailerConfigName);

      if (!mailerSettings) {

        mailerSettings = Environment.getMail(mailerConfigName);

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
    Manager : new MailManager()
  };
})();
