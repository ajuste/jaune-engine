/**
 * @file  Definition for <b>daemon statuses</b>
 * @author Alvaro Juste.
 */
(function() {

  "use strict";

  var
  /**
   * Status of system daemon.
   * @enumeration
   * @readonly
   * @enum {Number}
   */
  DaemonStatus = {
    /**
     * Stopped
     * @type {Number}
     */
    Stopped : 0,
    /**
     * Stopping
     * @type {Number}
     */
    Stopping : 1,
    /**
     * Started
     * @type {Number}
     */
    Started : 2,
    /**
     * Starting
     * @type {Number}
     */
    Starting : 3,
    /**
     * Daemon is down.
     * @type {Number}
     */
    Error : 4
  };
  module.exports = {
    DaemonStatus : DaemonStatus
  };
})();
