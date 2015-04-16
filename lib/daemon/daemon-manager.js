/**
 * @file	Definition for <b>mail manager</b>
 * @author Alvaro Juste.
 */
var
modules = {
	securityManager : null,
	uuid : new jaune.common.UUID()
},
settings = {
	securityManagerConfigured : false
},
data = {
	emptyUUID : modules.uuid.empty(),
	daemonUserId : "f4f24d9c-e793-4849-a386-b380b1aa4fa5"
};
/**
 * Checks for session requirements on authentication and login trust.
 * 
 * @param {Object} session Session.
 * @param {Number} [minimumLoginTrust] Minimum login trust.
 * @returns {Boolean} True if requirements have been fulfilled.
 */
function checkSessionDaemonLoginId(session, targetId) {
	return session.daemon === true && session.userId === data.daemonUserId;
}
/**
 * @class Manages errors in the application.
 * @name jaune.daemon.DaemonManager
 */
function DaemonManager() {
	if (!settings.securityManagerConfigured) {
		modules.securityManager = new jaune.security.SecurityManager();
		modules.securityManager.addIdCheckers("jaune.daemon.Daemon", checkSessionDaemonLoginId);
		settings.securityManagerConfigured = true;
	}
}
/**
 * Daemon manager prototype.
 * @name jaune.daemon.DaemonManager
 */
DaemonManager.prototype = (function() {
	
	var
	daemons = {},
	daemonsByType = {},
	loggingManager = new jaune.logging.LoggingManager(),
	logger = null;
	
	/**
	 * Gets the logger for the daemons.
	 * @return {Object} Logger
	 */
	function getLogger() {
		if (!logger) {
			logger = loggingManager.instance('core');
		}
		return logger;
	}
	
	return {
		/**
		 * Creates a new session usable only by daemons
		 * @function
		 * @returns {Object} New daemon session.
		 */
		createDaemonSession : function() {
			return {
				userId : data.daemonUserId,
				auth : true,
				daemon : true,
				loginTrust : jaune.security.LoginTrustLevel.Full
			};
		},
		/**
		 * Checks if descriptor is valid.
		 * @function
		 * @param {Object} descriptor Daemon descriptor.
		 * @throws {Error} When descriptor is invalid.
		 */
		checkDescriptor : function(descriptor) {

			if ("object" !== typeof descriptor) {
				throw new Error('descriptor');
			}
			if ("string" !== typeof descriptor.type || descriptor.type.length < 1) {
				throw new Error('descriptor.type');
			}
			if ("function" !== typeof descriptor.start) {
				throw new Error('descriptor.start');
			}
			if ("function" !== typeof descriptor.stop) {
				throw new Error('descriptor.stop');
			}
			if ("function" !== typeof descriptor.process) {
				throw new Error('descriptor.process');
			}
			if ("number" !== typeof descriptor.timeout || isNaN(descriptor.timeout) || descriptor.timeout <= 0) {
				throw new Error('descriptor.timeout');
			}
			if (descriptor.firstTimeout && ("number" !== typeof descriptor.firstTimeout || isNaN(descriptor.firstTimeout) || descriptor.firstTimeout <= 0)) {
				throw new Error("descriptor.firstTimeout");
			}
		},
		/**
		 * Spawns a daemon given the descriptor.
		 * @function
		 * @param {Object} descriptor Daemon descriptor.
		 * @returns {String} The id of the spawned daemon.
		 */
		spawnDaemon : function(descriptor) {
			
			this.checkDescriptor(descriptor);
			
			var
			daemon = new jaune.daemon.Daemon(descriptor, this.createDaemonSession()),
			daemonsByTypeCollection = daemonsByType[descriptor.type],
			daemonId = daemon.getId();
			
			if (!daemonsByTypeCollection) {
				daemonsByTypeCollection = {};
				daemonsByType[descriptor.type] = daemonsByTypeCollection;
			}
			daemonsByTypeCollection[daemonId] = daemon;
			daemons[daemonId] = daemon;
			
			return daemonId;
		},
		/**
		 * Kills a daemon given its id.
		 * @function
		 * @param {String} id Id.
		 */
		killDaemon : function(id) {
			throw 'not implemented';
		},
		/**
		 * Starts a daemon.
		 * @function
		 * @param {String} id Id of the daemon to be started.
		 * @param {Function} cb Callback
		 * @throws {Error} On daemon not found.
		 * @throws {Error} On invalid daemon status.
		 */
		startDaemon : function(id, cb) {
			var
			daemon = daemons[id];
			
			if (!daemon) {
				cb(new Error('invalid id'));
			}
			daemon.start(cb || function(){});
		},
		/**
		 * Stops a daemon.
		 * @function
		 * @param {String} id Id of the daemon to be stopped.
		 * @param {Function} cb Callback
		 * @throws {Error} On daemon not found.
		 * @throws {Error} On invalid daemon status.
		 */
		stopDaemon : function(id, cb) {
			var
			daemon = daemons[daemonId];
			
			if (!daemon) {
				cb(new Error('invalid id'));
			}
			daemon.stop(cb || function(){});
		},
		/**
		 * Gets the status of a daemon.
		 * @function
		 * @param {String} id The id of the daemon.
		 * @return {jaune.daemon.DaemonStatus} Status
		 */
		getDaemonStatus : function(id) {
			var
			daemon = daemons[daemonId];
			
			if (!daemon) {
				throw 'invalid id';
			}
			return daemon.getStatus();
		}
	};
})();
jaune.common.extend(jaune, {
	daemon : {
		DaemonManager : DaemonManager
	}
}, false);