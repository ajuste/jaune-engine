/**
 * @file Source code for MongooseDbClient.
 * @author Alvaro Juste
 */

var
mongoose = require('mongoose'),
q = require("q");
/**
 * Mongo DB client
 * @constructor
 * @param {Object} config Options
 */
function MongooseDbClient(config) {
	this.config = config;
	this.connection = mongoose.createConnection(config.url, config.opts);
	this.readyDeferred = q.defer();
	this.readyPromise = this.readyDeferred.promise;
	this.connection.once("error", jaune.common.bind(function(err) {
		this.readyDeferred.reject(err);
	}, this));
	this.connection.once("open", jaune.common.bind(function() {
		this.readyDeferred.resolve(this.connection);
	}, this));
}
MongooseDbClient.prototype = {
	/**
	 * Connect
	 * @function
	 * @param {Function} cb Callback
	 */
	connect : function(cb) {
		this
		.readyPromise
		.then(function(conn) {
			cb(undefined, conn);
		})
		.fail(function(err) {
			cb(err);
		});
	},
	/**
	 * Get mongoose handler.
	 * @function
	 * @returns {Object} Mongoose
   */
	mongoose : function() {
		return mongoose;
	}
};
jaune.common.extend(jaune, {
	db : {
		sql : {
			MongooseDbClient : MongooseDbClient
		}
	}
}, false);
