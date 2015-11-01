/**
 * @file  Definition for <b>daemon</b> base functionality.
 * @author Alvaro Juste.
 */
"use strict";

const _daemonStatus = require("./daemon-def").DaemonStatus;
const _uuid         = require("jaune-util").UUID;
const _co           = require("co");

/**
 * @class Represents a system daemon.
 * @param {Object} descriptor Daemon descriptor.
 * @param {Object} session Session to be used in this daemon.
 */
const Daemon = function (descriptor, session) {
  this.status     = _daemonStatus.Stopped;
  this.first      = true;
  this.id         = _uuid.plain();
  this.session    = session;
  this.descriptor = descriptor;
  this.interval   = null;
};

/**
 * @function Gets the descriptor of this daemon
 * @return   {Object} Descriptor
 */
Daemon.prototype.getDescriptor = function() {
  return this.descriptor;
};

/**
 * @function Gets the session of this daemon
 * @return   {Number} Status
 */
Daemon.prototype.getSession = function() {
  return this.session;
};

/**
 * @function Gets the status of this daemon
 * @return   {Number} Status
 */
Daemon.prototype.getStatus = function() {
  return this.status;
};

/**
 * @function Gets the id of this daemon
 * @return   {String} Id
 */
Daemon.prototype.getId = function() {
  return this.id;
};

/**
 * @function Starts the daemon.
 * @throws   {Error} When trying to start a service in an invalid status.
 */
Daemon.prototype.start = function* () {

  switch(this.status) {

    case _daemonStatus.Stopped :
    case _daemonStatus.Error :

      var self = this;

      try {
        yield this.descriptor.start();
        this.status = _daemonStatus.Started;
      }
      catch(err) {
        this.status = _daemonStatus.Error;
      }
      setTimeout(function() {
        co(self.descriptor.process());
        self.interval = setInterval(function() {
          co(self.descriptor.process());
        },self.descriptor.timeout);
      }, this.descriptor.firstTimeout || this.descriptor.timeout);

      break;

    case _daemonStatus.Started :
      break;

    default :
      throw new Error("invalid status");
  }
};

/**
 * @function Stops the daemon.
 * @throws   {Error} When trying to stop a service which is not started.
 */
Daemon.prototype.stop = function* () {

  switch(status) {

    case _daemonStatus.Started :
      this.first = true;

      try {
        yield this.descriptor.stop();
        this.status = _daemonStatus.Stopped;
      }
      catch(err) {
        this.status = _daemonStatus.Error;
      }
      break;

    case _daemonStatus.Stopped :
      break;

    default :
      throw new Error("invalid status");
  }
};

module.exports = {
  Daemon : Daemon
};
