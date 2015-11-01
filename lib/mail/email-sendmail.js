/**
 * @file File for defining Sendmail mailer.
 * @author Alvaro Juste
 */
"use strict";

const _moduleName     = "jaune/email/email-sendmail";
const _sendMail       = require("nodemailer").createTransport("sendmail");
const _unhandledError = require("../error").UnhandledError;
const _nfcall         = require("q").nfcall;
const _moduleCodes    = {
  ToNamesLengthDifferentThanTos : "001"
};

/**
 * @class Sendmail mailer
 * @param {Object} config The configuration
 */
const SendMailMailer = function (config) {
  this.config = config;
};

/**
 * @function Sends an email
 * @param    {Object} opts The options
 */
SendMailMailer.prototype.send = function* (opts) {

  const account = this.config.accounts[opts.accountName];
  const from    = account.name + " <" + account.account + ">";
  let   to      = null;

  if (opts.toNames && opts.toNames.length !== 0 && opts.toNames.length !== opts.to.length) {
    throw new _unhandledError({ message: "Invalid \"toNames\"", code : _moduleName  + _moduleCodes.ToNamesLengthDifferentThanTos });
  }
  if (opts.toNames) {
    to = opts.to.select(function(toEmail, index) {
      return opts.toNames[index] ? opts.toNames[index] + " <" + toEmail + ">" : toEmail;
    });
  }
  else {
    to = opts.to;
  }
  return  _nfcall.nfcall(_sendMail.sendMail, {
            from   : from,
            to     : to.join(", "),
            subject: opts.subject,
            html   : opts.body });
};
module.exports = {
  SendMailMailer : SendMailMailer
};
