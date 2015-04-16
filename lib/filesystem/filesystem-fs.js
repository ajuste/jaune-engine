/**
 * @file NodeJS module that implements file system handler based on local file system.
 * @author Alvaro Juste <juste.alvaro@gmail.com>
 */
var
modules = {
	mime : require('mime'),
	ncp : require('ncp'),
	path : require('path'),
	fs : require('fs'),
	env : new jaune.env.Environment()
},
settings = {
	folders : modules.env.getFolders()
};

function convertPathToAbsolute(path) {
	return modules.path.join(process.env.path, path);
}

/**
 * File system constructor.
 * @constructor
 * @param {object} connection Accepts the connection to the file system.
 */
var FSFileSystem = function(connection) {
	this.connection = connection;
};
//
FSFileSystem.prototype = {
	/**
	 * Writes a file into file system.
	 * @param {path} string The path to write file to.
	 * @param {object} options Collection of options.
	 * @param {Buffer} data Data to be written into file.
	 * @param {function} cb Standard callback function.
	 * @method
	 */
	writeFile : function(path, options, data, cb) {
		
		modules.fs.writeFile(convertPathToAbsolute(path), data, function(err) {
			cb(err);
		}); 
	},
	/**
	 * Reads a file at the given path.
	 * @param {path} string The path to read file from.
	 * @param {function} cb Standard callback function. Second parameter will be a read stream.
	 * @method
	 */
	readFile : function(path, cb, opts) {

		var
		absolute = convertPathToAbsolute(path);
		
		opts = opts || {};
		opts.encoding = opts.encoding || "binary";

		if (opts.encoding === 'binary') {
			this.exists(path, function(exists) {
				cb(!exists ? new Error('file does not exists)') : null, exists ? modules.fs.createReadStream(absolute) : null);
			});
		}
		else {
			modules.fs.readFile(absolute, opts.encoding, function(err, file) {
				cb(err, file);
			});
		}
	},
	/**
	 * Checks if file exists.
	 * @param {path} string The path to file.
	 * @param {function} cb Callback accepting flag parameter indicating the existence of the requested path.
	 * @method
	 */
	exists : function(path, cb) {
		modules.fs.exists(convertPathToAbsolute(path), function(exists) {
			cb(exists);
		});
	},
	/**
	 * Copies a path into another.
	 * @param {from} string The source path.
	 * @param {to} string The destination path.
	 * @param {function} cb Standard callback function.
	 * @method
	 */
	copy : function(from, to, cb) {
		modules.ncp(convertPathToAbsolute(from), convertPathToAbsolute(to), cb);
	},
	/**
	 * Retrieves the STAT object for a specified path.
	 * @param {path} string The source path.
	 * @param {function} cb Standard callback function.
	 * @method
	 */
	stat : function(path, cb) {
		modules.fs.stat(convertPathToAbsolute(path), function(err, stat){
			cb(err, stat ? new FSClientStat(path, stat) : null);
		});
	}
};
/**
 * Local file system STAT object wrapper.
 * @constructor
 * @param {object} connection Accepts the connection to the file system.
 * @param {string} path The path of the STAT object.
 */
var FSClientStat = function(path, stat) {
	this.stat = stat;
	this.path = path;
	this.mtime = this.stat.mtime;
	this.size = this.stat.size;
};
//
FSClientStat.prototype = {
	/**
	 * Checks if STAT is a directory.
	 */
	isDirectory : function() {
		return this.stat.isDirectory();
	},
	/**
	 * Returns the MIME type of file. 
	 */
	getMime : function() {
		return this.isDirectory() ? '' : modules.mime.lookup(convertPathToAbsolute(this.path));
	}
};
//begin: global
jaune.common.extend(jaune, {
	fs : {
		FsClient : FSFileSystem
	}
}, false);
//end: global