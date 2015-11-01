/**
 * @file File for defining Send Grid mailer.
 * @author Alvaro Juste
 */

"use strict";

const _unhandledError = require("../error").UnhandledError;
const _sendGrid       = require("sendgrid");
const _defer          = require("q").defer;

/**
 * @class Send grid mailer
 */
const SendGridMailer = function (config) {
  this.config = config;
};

/**
 * @function Sends an email
 * @param    {Object} opts The options
 */
SendGridMailer.prototype.send = function* (opts) {

  let   to      = null;
  const account = this.config.accounts[opts.accountName];
  const defer   = _defer();


  if (opts.toNames && opts.toNames.length !== 0 && opts.toNames.length !== opts.to.length) {
    throw new _unhandledError({ message: Invalid \"toNames\"", code : ModuleName  + ModuleCodes.ToNamesLengthDifferentThanTos });
  }
  if (opts.toNames) {
    to = opts.to.map((toEmail, index) =>
      opts.toNames[index] ? `${opts.toNames[index]} <${toEmail} ` : toEmail
    });
  }
  else {
    to = opts.to;
  }

  const sender = new _sendGrid.SendGrid(account.user, account.password);
  const email  = new _sendGrid.Email({
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
};

module.exports = {
  SendGridMailer : SendGridMailer
};
