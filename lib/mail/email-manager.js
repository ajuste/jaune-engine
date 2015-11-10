/**
 * @file Source code for Mail Manager.
 * @author Alvaro Juste
 */
"use strict";

const _mailers     = {};
const _reflection  = require("jaune-util").Reflection;
const _isString    = require("lodash").isString;

const MAIL_CONFIG_SECTION = "mail";

/**
 * @class The mailer manager
 */
const MailManager = function (env) {
  this.settings = env.getEnvProperty(MAIL_CONFIG_SECTION);
};

/**
 * @function Create a mailer
 * @param    {String} mailerConfigName The mailer name key
 * @returns  {Object} The mailer object
 * @throws   {Error} When mailer is not found
 */
MailManager.prototype.createMailer = function(mailerConfigName) {

  if (_isString(mailerConfigName)) {
    throw new Error("Invalid mailer configuration name");
  }
  let mailerSettings =
    settings[mailerConfigName] ||
    (settings[mailerConfigName] = this.settings[mailerConfigName];

  if (!mailerSettings) {
    throw new Error("Mailer configuration not found");
  }
  if (!_mailers[mailerConfigName]) {
    _mailers[mailerConfigName] = _reflection.createInstance(mailerSettings.type, [mailerSettings]);
  }
  if (!_mailers[mailerConfigName]) {
    throw new Error("Mailer constructor not found: " + mailerSettings.type);
  }
  return _mailers[mailerConfigName];
};

module.exports = {
  Manager : MailManager
};
