/**
 * @file	Definition for <b>daemon statuses</b>
 * @author Alvaro Juste.
 */
var
/**
 * Status of system daemon.
 * @enumeration
 * @readonly
 * @enum {Number}
 * @name jaune.daemon.DaemonStatus
 */
DaemonStatus = {
	/**
	 * Stopped
	 * @type {Number}
	 * @name jaune.daemon.DaemonStatus.Stopped
	 */
	Stopped : 0,
	/**
	 * Stopping
	 * @type {Number}
	 * @name jaune.daemon.DaemonStatus.Stopping
	 */
	Stopping : 1,
	/**
	 * Started
	 * @type {Number}
	 * @name jaune.daemon.DaemonStatus.Started
	 */
	Started : 2,
	/**
	 * Starting
	 * @type {Number}
	 * @name jaune.daemon.DaemonStatus.Starting
	 */
	Starting : 3,
	/**
	 * Daemon is down.
	 * @type {Number}
	 * @name jaune.daemon.DaemonStatus.Error
	 */
	Error : 4
};
jaune.common.extend(jaune, {
	daemon : {
		DaemonStatus : DaemonStatus
	}
}, false);