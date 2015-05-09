/**
 * @file File for defining Sendmail mailer.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var ModuleName     = "jaune/email/email-sendmail";
  var SendMail       = require("nodemailer").createTransport("sendmail");
  var UnhandledError = require("../error/errors").UnhandledError;
  var Instance       = new SendMailMailer();
  var ModuleCodes    = {
    ToNamesLengthDifferentThanTos : "001"
  };

  /**
   * @class sendmail mailer
   * @param {Object} config The configuration
   */
  var SendMailMailer = function (config) {
    this.config = config;
  };
  SendMailMailer.prototype = {
    /**
     * @function Sends an email
     * @param {Object} opts The options
     * @param {Function} The callback
     */
    send : function(opts, cb) {

      var
      account = this.config.accounts[opts.accountName],
      to = null,
      from = account.name + " <" + account.account + ">";

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

      SendMail.sendMail({
        from : from,
        to : to.join(", "),
        subject: opts.subject,
        html: opts.body },
        function(err, data) {
          cb(err, data);
        });
    }
  };
  module.exports = {
    SendMailMailer : Instance
  };
})();
