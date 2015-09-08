/**
 * @file File for defining Sendmail mailer.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  const ModuleName     = "jaune/email/email-sendmail";
  const SendMail       = require("nodemailer").createTransport("sendmail");
  const UnhandledError = require("../error/errors").UnhandledError;
  const Q              = require("q");
  const ModuleCodes    = {
    ToNamesLengthDifferentThanTos : "001"
  };

  /**
   * @class Sendmail mailer
   * @param {Object} config The configuration
   */
   const SendMailMailer = function (config) {
    this.config = config;
  };
  SendMailMailer.prototype = {
    /**
     * @function Sends an email
     * @param    {Object} opts The options
     */
    send : function* (opts) {

      const account = this.config.accounts[opts.accountName];
      const from    = account.name + " <" + account.account + ">";
      let   to      = null;

      if (opts.toNames && opts.toNames.length !== 0 && opts.toNames.length !== opts.to.length) {
        throw new UnhandledError({ message: "Invalid \"toNames\"", code : ModuleName  + ModuleCodes.ToNamesLengthDifferentThanTos });
      }
      if (opts.toNames) {
        to = opts.to.select(function(toEmail, index) {
          return opts.toNames[index] ? opts.toNames[index] + " <" + toEmail + ">" : toEmail;
        });
      }
      else {
        to = opts.to;
      }
      return  Q.nfcall(SendMail.sendMail, {
                from   : from,
                to     : to.join(", "),
                subject: opts.subject,
                html   : opts.body });
    }
  };
  module.exports = {
    SendMailMailer : SendMailMailer
  };
})();
