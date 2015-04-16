/**
 * @file Source code for Logging Manager.
 * @author Alvaro Juste
 */

var
modules = {
	env : new jaune.env.Environment(),
	reflection : new jaune.reflection.Reflection()
},
settings = {
	debug : modules.env.getDebugSettings().logging
};

var
instances = {};

/**
 * Manages logging in the application.
 * 
 * @returns
 */
function LoggingManager() {
	
	this.instance = function(loggerName) {
		
		if (!instances[loggerName]) {
			
			var
			set = modules.env.getLogging(loggerName);		
			
			if (set) {
				instances[loggerName] = {
					instance : modules.reflection.createInstance(set.module, [set]),
					settings : set
				};
			}
			else {
				return undefined;
			}
		}
		return instances[loggerName].instance;
	};
}
//	begin:	global
jaune.common.extend(jaune, {
	logging : {
		LoggingManager : LoggingManager
	}
}, false);
//	end:	global