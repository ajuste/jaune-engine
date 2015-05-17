/**
 * @file  Definition for <b>daemon</b> base functionality.
 * @author Alvaro Juste.
 */

(function() {

  "use strict";

  var DaemonStatus   = require("./daemon-def").DaemonStatus;
  var UUID           = require("../utils/uuid").UUID;
  var _     = require("underscore");

  /**
   * @class Represents a system daemon.
   * @param {Object} descriptor Daemon descriptor.
   * @param {Object} session Session to be used in this daemon.
   */
  var Daemon = function (descriptor, session) {
    this.status = DaemonStatus.Stopped;
    this.first = true;
    this.id = UUID.plain();
    this.session = session;
    this.descriptor = descriptor;
  };
  Daemon.prototype = {
    /**
     * @callback Called when service starts.
     * @param {*} err Error
     */
    onStart : function(err) {
      this.status = err ? DaemonStatus.Error : DaemonStatus.Started;
      this.onProcess();
    },
    /**
     * @callback Called when processing.
     */
    onProcess : function() {
      setTimeout(_.bind(function() {
        this.first = false;
        this.descriptor.process(_.bind(this.onProcess, this), this);
      }, this), this.first ? this.descriptor.firstTimeout || this.descriptor.timeout : this.descriptor.timeout);
    },
    /**
     * @function Gets the descriptor of this daemon
     * @return {Object} Descriptor
     */
    getDescriptor : function() {
      return this.descriptor;
    },
    /**
     * @function Gets the session of this daemon
     * @return {Number} Status
     */
    getSession : function() {
      return this.session;
    },
    /**
     * @function Gets the status of this daemon
     * @return {Number} Status
     */
    getStatus : function() {
      return this.status;
    },
    /**
     * @function Gets the id of this daemon
     * @return {String} Id
     */
    getId : function() {
      return this.id;
    },
    /**
     * @function Starts the daemon.
     * @param {Function} cb Start callback.
     * @throws {Error} When trying to start a service in an invalid status.
     */
    start : function(cb) {

      switch(this.status) {

        case DaemonStatus.Stopped :
        case DaemonStatus.Error :
          this.descriptor.start(_.bind(function(err) {
            if (!err) {
              this.onStart();
            }
            cb(err);
          }, this));

          break;

        case DaemonStatus.Started :
          process.nextTick(function() { cb(); });
          break;

        default :
          process.nextTick(function() { cb(new Error("invalid status")); });
          break;
      }
    },
    /**
     * @function Stops the daemon.
     * @param {Function} cb Stop callback.
     * @throws {Error} When trying to stop a service which is not started.
     */
    stop : function(cb) {

      switch(status) {

        case DaemonStatus.Started :
          this.first = true;
          this.descriptor.stop(function(err) {
            this.status = err ? DaemonStatus.Error : DaemonStatus.Stopped;
            cb(err);
          });
          break;

        case DaemonStatus.Stopped :
          process.nextTick(function() { cb(); });
          break;

        default :
          process.nextTick(function() { cb(new Error("invalid status")); });
          break;
      }
    }
  };
  module.exports = {
    Daemon : Daemon
  };
})();
