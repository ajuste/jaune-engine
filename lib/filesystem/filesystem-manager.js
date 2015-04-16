/**
 * @file Source code for file system manager.
 * @author Alvaro Juste <juste.alvaro@gmail.com>
 */
var
enums = {
	ReadResult : {
		Success : 0,
		InvalidPath : 1,
		NotFound : 2,
		InvalidResourceType : 3,
		NotModified : 4
	}
};
/**
 * 
 */
function FileSystemManager() {}

FileSystemManager.ReadResult = enums.ReadResult;

FileSystemManager.prototype = (function (){

	var
	modules = {
		environment : new jaune.env.Environment(),
		reflection : new jaune.reflection.Reflection()
	},
	settings = {
		debug : modules.environment.getDebugSettings().filesystem,
		modules : {}
	};
	
	return {
		/**
		 * 
		 */
		getModule : function(key) {

			var
			connection = null;

			if (!settings.modules[key]) {
				connection = modules.environment.getFileSystemConnection(key);
				settings.modules[key] = modules.reflection.createInstance(connection.type, [connection]);
			}
			return settings.modules[key];
		},
		
		read : function(module, args, cb) {
			var
			fstat = null;
			/**
			 * 
			 */
			function onExists(exists) {
				if (!exists) {
					cb(undefined, enums.ReadResult.NotFound);
				}
				else {
					module.stat(args.path, onStat);
				}
			}
			/**
			 * 
			 */
			function onStat(err, stat) {
				fstat = stat;
				/**
				 * 
				 */
				function onCacheCheck(err, hit) {
					if (err) {
						cb(err);
					}
					else  if (hit === false) {
						module.readFile(args.path, onReadFile);
					}
					else {
						cb(undefined, enums.ReadResult.NotModified, undefined);
					}
				}
				if (err) {
					cb(err);
				}
				else if (stat.isDirectory()){
					cb(undefined, enums.ReadResult.InvalidResourceType);
				}
				else if ("function" === typeof args.checkCache){
					//	call cache checking provided
					args.checkCache(stat, onCacheCheck);
				}
				else {
					onCacheCheck(false);
				}
			}
			/**
			 * 
			 */
			function onReadFile(err, stream) {
				if (err) {
					cb(err);
				}
				else {
					cb(undefined, enums.ReadResult.Success, stream, fstat);
				}
			}
			
			if (args.path.indexOf('./') !== -1) {
				cb(undefined, enums.ReadResult.InvalidPath);
			}
			else {
				module.exists(args.path, onExists);
			}
		}
	};
})();
//begin: global
jaune.common.extend(jaune, {
	fs : {
		FileSystemManager : FileSystemManager
	}
}, false);
//end: global