/**
 * @file  Definition for <b>mail manager</b>
 * @author Alvaro Juste.
 */
"use strict";

const _daemon          = require("./daemon").Daemon;
const _daemons         = {};
const _daemonsByType   = {};
const _daemonUserId    = "f4f24d9c-e793-4849-a386-b380b1aa4fa5";
const _loginTrustLevel = require("../security/security").LoginTrustLevel;

/**
 * @function Checks for session requirements on authentication and login trust.
 * @param    {Object} session Session.
 * @param    {Number} [minimumLoginTrust] Minimum login trust.
 * @returns  {Boolean} True if requirements have been fulfilled.
 */
function checkSessionDaemonLoginId(session, targetId) {
  return session.daemon === true && session.userId === _daemonUserId;
}

/**
 * @class Manages errors in the application.
 */
const DaemonManager = function (securityManager) {
  securityManager.addIdCheckers("jaune.daemon.Daemon", checkSessionDaemonLoginId);
};

/**
 * @function Creates a new session usable only by daemons
 * @returns  {Object} New daemon session.
 */
DaemonManager.prototype.createDaemonSession = function() {
  return {
    userId : _daemonUserId,
    auth : true,
    daemon : true,
    loginTrust : _loginTrustLevel.Full
  };
};

/**
 * @function Checks if descriptor is valid.
 * @param    {Object} descriptor Daemon descriptor.
 * @throws   {Error} When descriptor is invalid.
 */
DaemonManager.prototype.checkDescriptor = function(descriptor) {

  if ("object" !== typeof descriptor) {
    throw new Error("descriptor");
  }
  if ("string" !== typeof descriptor.type || descriptor.type.length < 1) {
    throw new Error("descriptor.type");
  }
  if ("function" !== typeof descriptor.start) {
    throw new Error("descriptor.start");
  }
  if ("function" !== typeof descriptor.stop) {
    throw new Error("descriptor.stop");
  }
  if ("function" !== typeof descriptor.process) {
    throw new Error("descriptor.process");
  }
  if ("number" !== typeof descriptor.timeout || isNaN(descriptor.timeout) || descriptor.timeout <= 0) {
    throw new Error("descriptor.timeout");
  }
  if (descriptor.firstTimeout && ("number" !== typeof descriptor.firstTimeout || isNaN(descriptor.firstTimeout) || descriptor.firstTimeout <= 0)) {
    throw new Error("descriptor.firstTimeout");
  }
};

/**
 * @function Spawns a daemon given the descriptor.
 * @param    {Object} descriptor Daemon descriptor.
 * @returns  {String} The id of the spawned daemon.
 */
DaemonManager.prototype.spawnDaemon = function(descriptor) {

  this.checkDescriptor(descriptor);

  const daemon    = new _daemon(descriptor, this.createDaemonSession());
  const daemonCat = _daemonsByType[descriptor.type] || (_daemonsByType[descriptor.type] = {});
  const daemonId  = daemon.getId();

  daemonCat[daemonId] = daemon;
  _daemons[daemonId]   = daemon;

  return daemonId;
};

/**
 * @function Kills a daemon given its id.
 * @param    {String} id Id.
 */
DaemonManager.prototype.killDaemon = function(id) {
  throw "not implemented";
};

/**
 * @function Starts a daemon.
 * @param    {String} id Id of the daemon to be started.
 * @throws   {Error} On daemon not found.
 * @throws   {Error} On invalid daemon status.
 */
DaemonManager.prototype.startDaemon = function* (id) {
  const  daemon = _daemons[id];

  if (!daemon) {
    throw new Error("daemon not found");
  }

  yield daemon.start();
};

/**
 * @function Stops a daemon.
 * @param    {String} id Id of the daemon to be stopped.
 * @param    {Function} cb Callback
 * @throws   {Error} On daemon not found.
 * @throws   {Error} On invalid daemon status.
 */
DaemonManager.prototype.stopDaemon = function* (id) {
  const daemon = _daemons[daemonId];

  if (!daemon) {
    throw new Error("daemon not found");
  }
  yield daemon.stop();
};

/**
 * @function Gets the status of a daemon.
 * @param    {String} id The id of the daemon.
 * @return   {DaemonStatus} Status
 */
DaemonManager.prototype.getDaemonStatus = function(id) {
  const daemon = _daemons[daemonId];

  if (!daemon) {
    throw new Error("daemon not found");
  }
  return daemon.getStatus();
};

module.exports = {
  Manager : DaemonManager
};
