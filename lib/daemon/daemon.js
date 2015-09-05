/**
 * @file  Definition for <b>daemon</b> base functionality.
 * @author Alvaro Juste.
 */

(function() {

  "use strict";

  const DaemonStatus = require("./daemon-def").DaemonStatus;
  const UUID         = require("../utils/uuid").UUID;
  const co           = require("co");
  const _            = require("underscore");
  /**
   * @class Represents a system daemon.
   * @param {Object} descriptor Daemon descriptor.
   * @param {Object} session Session to be used in this daemon.
   */
   const Daemon = function (descriptor, session) {
    this.status     = DaemonStatus.Stopped;
    this.first      = true;
    this.id         = UUID.plain();
    this.session    = session;
    this.descriptor = descriptor;
    this.interval   = null;
  };
  Daemon.prototype = {
    /**
     * @function Gets the descriptor of this daemon
     * @return   {Object} Descriptor
     */
    getDescriptor : function() {
      return this.descriptor;
    },
    /**
     * @function Gets the session of this daemon
     * @return   {Number} Status
     */
    getSession : function() {
      return this.session;
    },
    /**
     * @function Gets the status of this daemon
     * @return   {Number} Status
     */
    getStatus : function() {
      return this.status;
    },
    /**
     * @function Gets the id of this daemon
     * @return   {String} Id
     */
    getId : function() {
      return this.id;
    },
    /**
     * @function Starts the daemon.
     * @throws   {Error} When trying to start a service in an invalid status.
     */
    start : function* () {

      switch(this.status) {

        case DaemonStatus.Stopped :
        case DaemonStatus.Error :

          var self = this;

          try {
            yield this.descriptor.start();
            this.status = DaemonStatus.Started;
          }
          catch(err) {
            this.status = DaemonStatus.Error;
          }
          setTimeout(function() {
            co(self.descriptor.process());
            self.interval = setInterval(function() {
              co(self.descriptor.process());
            },self.descriptor.timeout);
          }, this.descriptor.firstTimeout || this.descriptor.timeout);

          break;

        case DaemonStatus.Started :
          break;

        default :
          throw new Error("invalid status");
      }
    },
    /**
     * @function Stops the daemon.
     * @throws   {Error} When trying to stop a service which is not started.
     */
    stop : function* () {

      switch(status) {

        case DaemonStatus.Started :
          this.first = true;

          try {
            yield this.descriptor.stop();
            this.status = DaemonStatus.Stopped;
          }
          catch(err) {
            this.status = DaemonStatus.Error;
          }
          break;

        case DaemonStatus.Stopped :
          break;

        default :
          throw new Error("invalid status");
      }
    }
  };
  module.exports = {
    Daemon : Daemon
  };
})();
