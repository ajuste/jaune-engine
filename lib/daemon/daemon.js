/**
 * @file	Definition for <b>daemon</b> base functionality.
 * @author Alvaro Juste.
 */
//	begin:	links
var
DaemonStatus = jaune.daemon.DaemonStatus;
//	end:	links
var
modules = {
	uuid : new jaune.common.UUID(),
	errorManager : new jaune.error.ErrorManager(),
	loggingManager : new jaune.logging.LoggingManager()
};

/**
 * @class Represents a system daemon.
 * @name {jaune.daemon.Daemon}
 * @param {Object} descriptor Daemon descriptor.
 * @param {Object} session Session to be used in this daemon.
 */
function Daemon(descriptor, session) {
	this.status = DaemonStatus.Stopped,
	this.first = true,
	this.id = modules.uuid.plain(),
	this.session = session;
	this.descriptor = descriptor;
}
Daemon.prototype = {
	/**
	 * Called when service starts.
	 * 
	 * @callback
	 * @param {*} err Error
	 */
	onStart : function(err) {
		this.status = err ? DaemonStatus.Error : DaemonStatus.Started;
		this.onProcess();
	},
	/**
	 * Called when processing.
	 * @callback
	 */
	onProcess : function() {
		setTimeout(jaune.common.bind(function() {
			this.first = false;
			this.descriptor.process(jaune.common.bind(this.onProcess, this), this);
		}, this), this.first ? this.descriptor.firstTimeout || this.descriptor.timeout : this.descriptor.timeout);
	},
	/**
	 * Gets the descriptor of this daemon
	 * @function
	 * @return {Object} Descriptor
	 */
	getDescriptor : function() {
		return this.descriptor;
	},
	/**
	 * Gets the session of this daemon
	 * @function
	 * @return {Number} Status
	 */
	getSession : function() {
		return this.session;
	},
	/**
	 * Gets the status of this daemon
	 * @function
	 * @return {Number} Status
	 */
	getStatus : function() {
		return this.status;
	},
	/**
	 * Gets the id of this daemon
	 * @function
	 * @return {String} Id
	 */
	getId : function() {
		return this.id;
	},
	/**
	 * Starts the daemon.
	 * @function
	 * @param {Function} cb Start callback.
	 * @throws {Error} When trying to start a service in an invalid status.
	 */
	start : function(cb) {
		
		switch(this.status) {
			
			case DaemonStatus.Stopped :
			case DaemonStatus.Error :
				
				this.descriptor.start(jaune.common.bind(function(err) {
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
				
				process.nextTick(function() { cb(new Error('invalid status')); });
			
				break;
		}
	},
	/**
	 * Stops the daemon.
	 * @function
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
				
				process.nextTick(function() { cb(new Error('invalid status')); });
			
				break;
		}
	}
};
jaune.common.extend(jaune, {
	daemon : {
		Daemon : Daemon
	}
}, false);