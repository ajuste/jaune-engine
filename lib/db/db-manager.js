/**
 * @file Source code for Database Manager.
 * @author Alvaro Juste
 */

var
handlers = {},
environment = new jaune.env.Environment(),
reflection = new jaune.reflection.Reflection(),
connections = environment.getDatabaseConnection(),
ModuleName = 'linkstern/db-manager',
ModuleCodes = {
	ConfigurationNotFound : '001',
	HandlerInstantiationFailed : '002',
	HandlerConstuctorNotFound : '003'
};

function DatabaseManager() {
	
}

DatabaseManager.prototype = {
	
	/**
	 * 
	 */
	getClientFromConfiguration : function(key) {

		var
		handler = null,
		configuration = environment.getDatabaseConnection(key);

		if (typeof configuration === 'undefined') {
			throw new jaune.error.UnhandledError({ message: 'Connection not found: ' + key, code : ModuleName  + ModuleCodes.ConfigurationNotFound });
		}

		//	try to get handler if loaded, if not load it.
		handler = handlers[configuration.type];

		if (typeof handler === 'undefined') {
			
			try {

				handler = reflection.evaluateName(configuration.type);
				
				if (handler === null) {
					throw new jaune.error.UnhandledError({ message: 'Constructor not found: ' + configuration.type, code : ModuleName  + ModuleCodes.HandlerConstuctorNotFound, cause : err });
				}
			}
			catch(error) {
				throw new jaune.error.UnhandledError({ message: 'Unable to instance configuration: ' + key, code : ModuleName  + ModuleCodes.HandlerInstantiationFailed, cause : error });
			}
			handlers[configuration.type] = handler;
		}
		return new handler(configuration);
	}
};
//begin:	global
jaune.common.extend(jaune, {
	db : {
		DatabaseManager : DatabaseManager
	}
}, false);
//end:	global