/**
 * @file File for defining Send Grid mailer.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var UnhandledError = require("../error/errors").UnhandledError;
  var SendGrid       = require("sendgrid");
  var Instance       = new SendGridMailer();

  /**
   * @class Send grid mailer
   */
  var SendGridMailer = function (config) {
    this.config = config;
  };
  SendGridMailer.prototype = {
    /**
     * @function Sends an email
     * @param {Object} opts The options
     * @param {Function} The callback
     */
    send : function(opts, cb) {

      var
      sender = null,
      email = null,
      to = null,
      account = this.config.accounts[opts.accountName];

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
      sender = new SendGrid.SendGrid(account.user, account.password);
      email = new SendGrid.Email({
        to : to,
        from : account.account,
        fromname : account.name,
        subject : opts.subject,
        html : opts.body
      });
      sender.send(email, function(err, data){
        cb(err || err === false ? data : undefined);
      });
    }
  };
  module.exports = {
    SendGridMailer : Instance
  };
})();
