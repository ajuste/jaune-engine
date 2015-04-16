function App() {}

App.prototype = {
	/* Fulfills prerequisites for the server to work.
	 * @function
	 * @returns Nothing
	 */
	pre : function() {
		if (!process.env) {
			process.env = {};
		}
		process.env.type = "production";
		process.env.path = process.cwd();
		process.app = this;
	},
	/**
	 * Parses arguments from command line that are directed to this class.
	 * @function
	 * @returns Nothing
	 */
	parseArguments : function() {
		for(var i = 0; i < process.argv.length; i++) {
			switch(process.argv[i]) {
				case '--develop' :
					process.env.type = 'development';
				break;
			}
		}
	},
	/**
	 * Loads static references.
	 * @function
	 * @returns Nothing
	 */
	loadStatic : function() {

		if ("string" !== typeof this.configuration.globalNamespace) {
			throw new Error("configuration.globalNamespace is not defined");
		}
		global.jaune = {};
		global[this.configuration.globalNamespace] = {};

		require('../utils/boolean');
		require('../utils/misc');
		require('../utils/reflection');
		require('../utils/array');
		require('../utils/date');
		require('../utils/time');
		require('../utils/uuid');
		require('../utils/streams');
		require('../utils/convert');
		require('../utils/debug');
		require('../utils/validator');
		require('../crypto/hashing');
		require('../server/environment');
		require('../logging/logging-manager');
		require('../error/errors');
		require('../error/error-manager');
		require('../security/security');
		require('../filesystem/filesystem-manager');
		require('../filesystem/filesystem-fs');
		require('../filesystem/filesystem-dropbox');
		require('../daemon/daemon-def');
		require('../daemon/daemon');
		require('../daemon/daemon-manager');
		require('../http/http-cache');
		require('../http/http-response-encoding');
		require('../http/http-util');
		require('../mail/email-sendgrid');
		require('../mail/email-sendmail');
		require('../mail/email-manager');
		require('../db/db-sql-query-executor');
		require('../db/db-sql-pg');
		require('../db/db-nosql-mongoose');
		require('../db/db-manager');
		require('../db/db-sql-util');
		require('../localization/locale');

		//	application specific statics.
		this.configuration.init.loadStatic();

		require('../server/express');
	},
	/**
	 * Starts the server.
	 * @function
	 * @returns Nothing
	 */
	startServer : function() {
		new jaune.server.Express(this.configuration).init();
	},
	/**
	 * Initialize the application.
	 * @function
	 * @param {Object} configuration Application configuration
	 * @returns Nothing
	 */
	init : function(configuration) {
		this.configuration = configuration;
		this.pre();
		this.parseArguments();
		this.loadStatic();
		this.startServer();
	}
};
exports.App = App;
