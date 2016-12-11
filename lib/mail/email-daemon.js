/**
 * @file   Definition for <b>mail daemon</b>
 * @author Alvaro Juste.
 */

"use strict";

// 3rd
const _bind       = require("lodash").bind;
const _defer      = require("q").defer;
const _co         = require("co");

// jaune
const _moduleName = "deamon/mail";

/**
 * @class Daemon in charge of reading the mail queue and calling mail providers
 * @param {Object} mailManager System mail manager to use
 * @param {Object} logger The logger to use
 * @param {Function} callbacks.getListSendeables Gets list of sendeable emails
 * @param {Function} callbacks.registerSuccess Notify a send success
 * @param {Function} callbacks.registerFailure Notify a send failure
 * @param {Number} settings.timeout Daemon timeout
 * @param {Number} settings.firstTimeout Daemon first timeout
 * @param {Number} settings.processSpan How many emails process for iteration
 * @param {Number} settings.sendTimeout Timeout before fail
 */
const MailsDaemon = function(mailManager, callbacks, settings, logger) {
  this.mailManager = mailManager;
  this.callbacks   = callbacks;
  this.settings    = settings;
  this.logger      = logger;
  this.looping     = false;
  this.page        = 1;
  this.descriptor  = {
    timeout      : settings.timeout,
    firstTimeout : settings.firstTimeout,
    start        : _bind(this.start, this),
    stop         : _bind(this.stop, this),
    type         : "jaune.app.mail.MailsDaemon",
    process      : _bind(this.doProcess, this)
  };
};

/**
 * @function Start deamon
 * @param    {Function} cb The callback
 */
MailsDaemon.prototype.start = function* () {};

/**
 * @function Stop deamon
 * @param    {Function} cb The callback
 */
MailsDaemon.prototype.stop = function() {};

/**
 * @function Triggers daemon processing.
 * @param    {Function} cb The callback
 */
MailsDaemon.prototype.doProcess = function* () {

  if (this.looping) return;

  this.looping = true;
  this.page    = 1;

  try {
    yield this.processQueue();
  }
  catch(err) {
    throw err;
  }
  finally {
    this.page    = 1
    this.looping = false;
  }
};

/**
 * @function Process current queue this.page.
 */
MailsDaemon.prototype.processQueue = function* () {

  let mails;
  let defer;

  do {
    defer = _defer();
    mails = yield this.callbacks.getListSendeables({
                      page        : this.page++,
                      processSpan : this.settings.processSpan
                    });

    yield (_
          .chain(mails)
          .map(mail => new MailSenderInstance(mail).send(mail))
          .value());

  } while(mails.length);
};

MailsDaemon.prototype.getDescriptor = function() {
  return this.descriptor;
};
/**
 * @class Sender instance for one email
 */
const MailSenderInstance = function() {};

/**
 * @function Send mail
 */
MailsDaemon.prototype.send = function* (mail) {

  const self    = this;
  const mailer  = this.mailManager.createMailer(mail.mailerConfigKey);

  this.timeout = setTimeout(_bind(this.onEmailTimeout, this), this.settings.sendTimeout);

  try {
    yield mailer.send(mail);
    yield this.callbacks.registerSuccess(mail);
  }
  catch(err) {
    yield this.registerFailure(err, mailr);
  }
  finally {
    this.clearTimeout();
  }
};

MailsDaemon.prototype.clearTimeout = function() {
  if (this.timeout) {
    clearTimeout(this.timeout);
    this.timeout = null;
  }
};

/**
 * @function Callback for email timeout.
 */
MailsDaemon.prototype.onEmailTimeout = function() {
  clearTimeout();
  this.timeout = null;
  _co(this.registerFailure(this.mail));
};

/**
 * @function Registers a failure on sendsing an email.
 * @param    {Object} err The error
 * @param    {Object} mail The email
 * @returns  Nothing
 */
MailsDaemon.prototype.registerFailure = function* (err, mail) {
  yield this.callbacks.registerFailure(mail);
};

module.exports = {
  MailsDaemon : MailsDaemon
};
