/**
 * @file Source code for POSTGRESQL client.
 * @author Alvaro Juste
 */

var 
pg = require('pg'), 
environment = new jaune.env.Environment(), 
debug = new jaune.common.Debug(), 
debugSettings = environment.getDebugSettings().sql,
lastId = 0;

function standarizeError(err) {
	
	var
	result = err,
	fieldText = null;
	
	if (err && "object" === typeof err) {
		if ("undefined" !== typeof err) {
			try {
				fieldText = JSON.stringify({
					arguments : err.arguments,
					code : err.code,
					detail : err.detail,
					file : err.file,
					hint : err.hint,
					internalPosition : err.internalPosition,
					internalQuery : err.internalQuery,
					length : err.length,
					line : err.line,
					message : err.message,
					name : err.name,
					position : err.position,
					routine : err.routine,
					severity : err.severity,
					stack : err.stack,
					type : err.type,
					where : err.where
				});
			}
			catch(ex) {
				fieldText = "Error while standarizing exception: " + ex;
			}
			finally {
				result.causeToString = fieldText;
			}
		}
	}
	return result;
}

/**
 * 
 * @param opts
 * @returns
 */
function PostgresClient(opts) {
	this.opts = opts;
}
PostgresClient.prototype = {
	/**
	 * Initializes a connection.
	 * 
	 * @function
	 * @private
	 * @param {Object} client Driver provided database client.
	 * @param {Function} release Driver provided release function.
	 * @returns {Object} A new connection.
	 */
	initConnection : function(client, release) {
		client.jaune = "undefined" === typeof client.jaune ? new PostgresConnection(client, release, this.opts) : client.jaune;		
		return client.jaune;
	},
	/**
	 * Creates a new Link object.
	 * 
	 * @function
	 * @private
	 * @param {Boolean} [handleConnection] Handle connection flag.
	 * @returns {Object} A new link.
	 */
	getLink : function(handleConnection, tx) {
		return { 
			handleConnection : typeof handleConnection === 'boolean' ? handleConnection : true
		};
	},
	/**
	 * Function that will reuse same connection or create a new
	 * one if no connection is provided.
	 * 
	 * @function
	 * @param {Function} cb Callback.
	 * @param {Object} [chainedClient] A client provided by this manager.
	 */
	chain : function(cb, chainedClient) {
		
		var
		handleConnection = !chainedClient,
		effectiveClient = null;
		
		/**
		 * Function provided to close.
		 * 
		 * @function
		 * @param {Object} opts Options passed to callback
		 */
		function close(opts) {
			
			opts = opts || {};
			
			if (debugSettings.links) {
				debug.printText("Closing connection (" + effectiveClient.id + ") from chained.");
			}
			effectiveClient.close(function() {
				if (cb.end) {
					
					if (cb.end.length === 1) {
						cb.end(opts);
					}
					else {
						cb.end(standarizeError(opts.error), opts.result);
					}
				}
			});
		}
		/**
		 * On connect.
		 * 
		 * @function
		 * @param {Object} newClient Client provided by driver to be used on subsequent calls.
		 * @param {*} err Error that might have been raised.
		 */
		function onConnect(newClient, err) {
			
			effectiveClient = newClient;
			
			if (!err && !handleConnection) {
				
				effectiveClient.push(this.getLink(false), effectiveClient);
				
				if (debugSettings.links) {
					debug.printText("Link pushed while connecting chained for connection (" + effectiveClient.id + "): " + effectiveClient.links.length);
				}
			}
			cb.connect(effectiveClient, standarizeError(err), close);
		}
		if (handleConnection) {
			this.connect(jaune.common.bind(onConnect, this));
		}
		else {
			onConnect.call(this, chainedClient);
		}
	},
	/**
	 * Connect by providing pool name.
	 */
	connect : function(callback) {
		pg.connect(this.opts.server, jaune.common.bind(function(err, cli, done) {
			
			var connection = this.initConnection(cli, done);
			
			if (connection.links.length !== 0) {
				callback(undefined, new Error("this connection is dirty - links already present: " + connection.links.length));
			}
			else {
				if (!err) {
					connection.links.push(this.getLink());
					if (debugSettings.links) {
						debug.printText("Link pushed while connecting for connection (" + connection.id + "): " + connection.links.length);
					}
				}
				callback(connection, standarizeError(err));
			}
		}, this));
	},
	/**
	 * 
	 */
	getConnectionsCountInPool : function() {
		return pg.pools.getOrCreate(this.opts.server).availableObjectsCount();
	},
	/**
	 * 
	 */
	getConnectionPoolSize : function() {
		return pg.pools.getOrCreate(this.opts.server).getPoolSize();
	}
};
/**
 * @class POSTGRESQL connection handler.
 * @constructor Creates a new instance of a connection handler.
 * @param {Object} opts Options
 * @param {Object} client Native client object.
 * @param {Function} release Function used to release connection which is provided by driver.
 */
function PostgresConnection(client, release, opts) {
	this.release = release;
	this.client = client;
	this.opts = opts;
	this.links = [];
	this.tx = false;
	this.id = "PG-" + lastId++;
}
/**
 * 
 */
PostgresConnection.prototype = {
	init : function(client) {
		if ("undefined" === typeof client.jaune) {
			client.jaune = this;
		}
	},
	push : function(link) {
		this.links.push(link);
	},
	pop : function() {
		return this.links.pop();
	},
	current : function() {
		return this.links[this.links.length - 1];
	},
	isTransactionOpen : function() {
		//return !!this.links.first(function(e) { return e.tx === true; });
		return this.tx === true;
	},
	setTransaction : function(value) {
		//(this.links.first(function(e) { return e.tx === true; }) || {}).tx = false;
		this.tx = value;
	},
	anyPendingLink : function() {
		return this.links > 1;
	},
	/**
	 * Begins a transaction.
	 * @param {function} callback The callback
	 */
	begin : function(callback) {
		/**
		 * Call back for query executed.
		 * @param {Object} err The error.
		 * @returns Nothing.
		 */
		function onBegin(err) {
			if (!err) {
				this.setTransaction(true);
			}
			if (callback) {
				callback(standarizeError(err));
			}
		}
		if (!this.isTransactionOpen()) {
			this.query({ sql: "BEGIN;" }, jaune.common.bind(onBegin, this));
		}
		else {
			onBegin.call(this);
		}
	},
	/**
	 * Rolls back a transaction.
	 * @param {function} callback The callback
	 */
	rollback : function(callback) {
		var
		link = this.current();
		/**
		 * Call back for query executed.
		 * @param {Object} err The error.
		 * @returns Nothing.
		 */
		function onQueryExecuted(err) {
			if (!err) {
				this.setTransaction(false);
			}
			if (callback) {
				callback(standarizeError(err));
			}
		}
		if (link.handleConnection === true && this.isTransactionOpen()) {
			this.query({ sql: "ROLLBACK;" }, jaune.common.bind(onQueryExecuted, this));
		}
		else {
			callback();
		}
	},
	/**
	 * Commits a transaction.
	 * @param {function} callback The callback
	 */
	commit : function(callback) {
		var
		link = this.current();
		/**
		 * Call back for query executed.
		 * @param {Object} err The error.
		 * @returns Nothing.
		 */
		function onQueryExecuted(err) {
			if (!err) {
				this.setTransaction(false);
			}
			if (callback) {
				callback(standarizeError(err));
			}
		}
		if (link.handleConnection === true && this.isTransactionOpen()) {
			this.query({ sql: "COMMIT;" }, jaune.common.bind(onQueryExecuted, this));
		}
		else {
			callback();
		}
	},
	/**
	 * Rolls back a transaction and close the connection.
	 * @param {function} callback The callback
	 */
	rollbackAndClose : function(callback) {
		function onRollback(err) {
			this.close(); 
			callback(standarizeError(err));
		}
		this.rollback(jaune.common.bind(onRollback, this));
	},
	/**
	 * Commits a transaction and close the connection.
	 * @param {function} callback The callback
	 */
	commitAndClose : function(callback) {
		
		function onCommit(err) {
			this.close(); 
			callback(standarizeError(err));
		}
		this.commit(jaune.common.bind(onCommit, this));
	},
    /**
     * Execute a query
     * @function
     * @param {Object} query.sql Query to be executed.
     * @param {Array} [query.args] Arguments
     * @param {Function} [callback] Callback
     */
	query : function(query, callback) {
		
		if (debugSettings.queries) {
			debug.printObject(query);
			debug.printText((query.args || []).join(','));
		}
		
		this.client.query(query.sql, query.args || [], function(err, results) {
			if (callback) {
				callback(standarizeError(err), err ? undefined : results.rows, this.client);
			}
		});
	},
  /**
   * Call a function / stored procedure
   * @function
   * @param {Object} query.sql The name of the member to call
   * @param {Array} [query.args] Arguments
   * @param {Function} [callback] Callback
   */
  call : function(query, callback) {
      
      var
      parameterIndex = 1,
      args = query.args || [];
      
      this.query({ sql : "SELECT * FROM " + query.sql + "(" + args.select(function(e) { return "$" + parameterIndex++; }).join(", ") + ");", args : query.args }, callback);
  },
	/**
	 * 
	 */
	close : function(cb) {
		
		var
		link = this.current();
		
		function onCommit() {
			if (typeof this.release === 'function') {
				this.pop();
				if (debugSettings.links) {
					debug.printText("Link pop while closing for connection (" + this.id + "): " + this.links.length);
				}
				if (link.handleConnection === true) {
					if (debugSettings.links) {
						debug.printText("Connection released - " + this.id + ".");
					}
					this.release();
				}
				if (cb) {
					cb();
				}
			}
		}
		this.commit(jaune.common.bind(onCommit, this));
	},
	/**
	 * 
	 */
	exception : function() {
		this.close();
	}
};
//begin:	global
jaune.common.extend(jaune, {
	db : {
		sql : {
			PostgresClient : PostgresClient
		}
	}
}, false);
//end:	global