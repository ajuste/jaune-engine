/**
 * @file File for defining Send Grid mailer.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  const UnhandledError = require("../error/errors").UnhandledError;
  const SendGrid       = require("sendgrid");
  const Q              = require("q");
  const _              = require("underscore");

  /**
   * @class Send grid mailer
   */
  const SendGridMailer = function (config) {
    this.config = config;
  };
  SendGridMailer.prototype = {
    /**
     * @function Sends an email
     * @param    {Object} opts The options
     */
    send : function* (opts) {

      let   to      = null;
      const account = this.config.accounts[opts.accountName];
      const defer   = Q.defer();


      if (opts.toNames && opts.toNames.length !== 0 && opts.toNames.length !== opts.to.length) {
        throw new UnhandledError({ message: Invalid \"toNames\"", code : ModuleName  + ModuleCodes.ToNamesLengthDifferentThanTos });
      }
      if (opts.toNames) {
        to = opts.to.map((toEmail, index) =>
          opts.toNames[index] ? `${opts.toNames[index]} <${toEmail} ` : toEmail
        });
      }
      else {
        to = opts.to;
      }

      const sender = new SendGrid.SendGrid(account.user, account.password);
      const email = new SendGrid.Email({
        to       : to,
        from     : account.account,
        fromname : account.name,
        subject  : opts.subject,
        html     : opts.body
      });
      sender.send(email, function(err, data){
        if (err || err === false) {
          defer.reject(data);
        }
        else {
          defer.resolve(data);
        }
      });
      return defer.promise();
    }
  };
  module.exports = {
    SendGridMailer : SendGridMailer
  };
})();
