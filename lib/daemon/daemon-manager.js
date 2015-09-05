/**
 * @file  Definition for <b>mail manager</b>
 * @author Alvaro Juste.
 */
(function() {

  "use strict";

  const Daemon          = require("./daemon").Daemon;
  const Daemons         = {};
  const DaemonsByType   = {};
  const DaemonUserId    = "f4f24d9c-e793-4849-a386-b380b1aa4fa5";
  const LoggingManager  = require("../logging/logging-manager").LoggingManager;
  const Security        = require("../security/security");
  const SecurityManager = Security.Manager;
  let   Logger          = null;

  /**
   * @function Checks for session requirements on authentication and login trust.
   * @param    {Object} session Session.
   * @param    {Number} [minimumLoginTrust] Minimum login trust.
   * @returns  {Boolean} True if requirements have been fulfilled.
   */
  function checkSessionDaemonLoginId(session, targetId) {
    return session.daemon === true && session.userId === DaemonUserId;
  }

  /**
   * @function Gets the Logger for the daemons.
   * @return   {Object} Logger
   */
  function getLogger() {
    if (!Logger) {
      Logger = Logger.instance("core");
    }
    return Logger;
  }

  /**
   * @class Manages errors in the application.
   */
  const DaemonManager = function () {
    SecurityManager.addIdCheckers("jaune.daemon.Daemon", checkSessionDaemonLoginId);
  };
  /**
   * Daemon manager prototype.
   */
  DaemonManager.prototype = {
    /**
     * @function Creates a new session usable only by daemons
     * @returns  {Object} New daemon session.
     */
    createDaemonSession : function() {
      return {
        userId : DaemonUserId,
        auth : true,
        daemon : true,
        loginTrust : Security.LoginTrustLevel.Full
      };
    },
    /**
     * @function Checks if descriptor is valid.
     * @param    {Object} descriptor Daemon descriptor.
     * @throws   {Error} When descriptor is invalid.
     */
    checkDescriptor : function(descriptor) {

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
    },
    /**
     * @function Spawns a daemon given the descriptor.
     * @param    {Object} descriptor Daemon descriptor.
     * @returns  {String} The id of the spawned daemon.
     */
    spawnDaemon : function(descriptor) {

      this.checkDescriptor(descriptor);

      const daemon    = new Daemon(descriptor, this.createDaemonSession());
      const daemonCat = DaemonsByType[descriptor.type] || (DaemonsByType[descriptor.type] = {});
      const daemonId  = daemon.getId();

      daemonCat[daemonId] = daemon;
      Daemons[daemonId]   = daemon;

      return daemonId;
    },
    /**
     * @function Kills a daemon given its id.
     * @param    {String} id Id.
     */
    killDaemon : function(id) {
      throw "not implemented";
    },
    /**
     * @function Starts a daemon.
     * @param    {String} id Id of the daemon to be started.
     * @throws   {Error} On daemon not found.
     * @throws   {Error} On invalid daemon status.
     */
    startDaemon : function* (id) {
      const  daemon = Daemons[id];

      if (!daemon) {
        throw new Error("daemon not found");
      }

      yield daemon.start();
    },
    /**
     * @function Stops a daemon.
     * @param    {String} id Id of the daemon to be stopped.
     * @param    {Function} cb Callback
     * @throws   {Error} On daemon not found.
     * @throws   {Error} On invalid daemon status.
     */
    stopDaemon : function* (id) {
      const daemon = Daemons[daemonId];

      if (!daemon) {
        throw new Error("daemon not found");
      }
      yield daemon.stop();
    },
    /**
     * @function Gets the status of a daemon.
     * @param    {String} id The id of the daemon.
     * @return   {DaemonStatus} Status
     */
    getDaemonStatus : function(id) {
      const daemon = Daemons[daemonId];

      if (!daemon) {
        throw new Error("daemon not found");
      }
      return daemon.getStatus();
    }
  };
  module.exports = {
    DaemonManager : new DaemonManager()
  };
})();
