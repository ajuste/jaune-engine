/**
 * @file Source code for SQL Database utility
 * 
 * @author Alvaro Juste
 */
(function() {
	"use strict";
	var
	modules = {
		errorManager : new jaune.error.ErrorManager(),
		queryExecutor : new jaune.db.sql.SqlQueryExecutor(),
		validator : new jaune.common.Validator(),
		uuid : new jaune.common.UUID()
	};
	/**
	 * @class High level utility which uses best practices and tools
	 * of the framework. This utility should be used by modules
	 * to send queries to database as it separates database
	 * from the module.
	 * @param {String} configurationKey The key that identifies the connection to use in configuration.
	 * @name jaune.db.SqlUtil
	 */
	function SqlUtil(configurationKey) {
		this.sql = new jaune.db.DatabaseManager().getClientFromConfiguration(configurationKey);
	}
	SqlUtil.prototype = {
		/**
		 * Returns callback to be used in chained call backs.
		 * 
		 * @param {Function} cb The chained callback to be called after default callback does required work.
		 * @param {jaune.db.SqlUtil.Executor} executor Query executor
		 * @param {*} [options.result] Result to be passed to callback. If passed, result from query is stored inside data property name.
		 * @param {*} [resultProperty] Name of the property were to set result.
		 * @returns {Function} The callback function
		 */
		defaultCallback : function(cb, executor, options) {
			
			options = options || {};
		
			return function(err, result) {
				if (err) {
					executor.doError(cb, err);
				}
				else {
					
					if (options.result) {
						if (options.resultProperty) {
							options.result[options.resultProperty] = result;
							delete options.resultProperty;
						}
						else if ("undefined" === typeof options.result.data){
							options.result.data = result;
						}
					}
					executor.doSuccess(cb, options.result || result);
				}
			};
		},
		/**
		 * Executes a call to an db object.
		 * 
		 * @function
		 * @param {*} client The client to execute query.
		 * @param {String} query The query.
		 * @param {Array} parameters Parameters for the query.
		 * @param {Function} cb Callback function.
		 * @param {Object} context Execution context.
		 * @param {Function} [post] Post execution function
		 */
		call : function(client, query, parameters, cb, context, post) {
			this.query(client, query, parameters, cb, context, post, "call");
		},
		/**
		 * Executes a query.
		 * 
		 * @function
		 * @param {*} client The client to execute query.
		 * @param {String} query The query.
		 * @param {Array} parameters Parameters for the query.
		 * @param {Function} cb Callback function.
		 * @param {Object} context Execution context.
		 * @param {Function} [post] Post execution function
		 * @param {String} [type] Type of query
		 */
		query : function(client, query, parameters, cb, context, post, type) {
			
			var effectiveCb = cb;
			
			if ("function" === typeof post) {
				effectiveCb = function(err, result) {
					if (result) {
						try{
							result.forEach(function(e) {
								post(e);
							});
						}
						catch(ex) {
							err = ex;
						}
					}
					if (cb) {
						cb(err, result);
					}
				};
			}
			modules.queryExecutor.execute(client, query, parameters, { end : effectiveCb }, context, type);
		},
		/**
		 * Executes a function inside a chain. The function
		 * to be executed will be passed with all tools
		 * in order to keep any live transaction functional.
		 * 
		 * @param {Function} fn Function to be executed.
		 * @param {Function} cb Callback function.
		 * @param {*} [chainedClient] Connection to use if any. Otherwise a new will be obtained.
		 * @param {Object} [options] Options.
		 */
		executeChained : function(fn, cb, chainedClient, options) {
			function onChain(err, executor) {
				if (err) {
					cb(err);
				}
				else {
					fn(executor, this.defaultCallback(cb, executor, options));
				}
			}
			this.chain(jaune.common.bind(onChain, this), chainedClient);
		},
		/**
		 * Prepares chained execution.
		 * 
		 * @param {Function} cb Callback function.
		 * @param {*} [chainedClient] Connection to use if any. Otherwise a new will be obtained.
		 * @param {Object} [options] Options.
		 */
		chain : function(cb, chainedClient, options) {
			var
			chainedCallback = { connect : onChain };
			/**
			* On ready callback.
			* 
			* @callback
			* @param {Object} client The SQL client
			* @param {*} err Error on connection
			* @param {Function} close Close function
			*/
			function onReady(client, err, close) {
				cb(err, new Executor(client, chainedCallback, close));
			}
			/**
				* Chain callback.
				* 
				* @callback
				* @param {Object} client The SQL client
				* @param {*} err Error on connection
				* @param {Function} close Close function
				*/
			function onChain(client, err, close) {
				options = options || {};
				/**
					* Begin callback
					* 
					* @callback
					* @param {*} [beginError] Error while begin transaction.
					*/
				function onBeginCallback(beginError) {
					onReady(client, beginError, close);
				}
				if (err) {
					cb(err);
				}
				else if (options.tx === true) {
					client.begin(onBeginCallback);
				}
					else {
					onReady(client, undefined, close);
				}
			}
			this.sql.chain(chainedCallback, chainedClient);
		},
		/**
		 * Converts an array of any to SQL parameter value.
		 * @param {Array} array Array to convert.
		 * @param {Function} [selector] Function that converts from input to string id.
		 * @returns {String} Parameter.
		 */
		toIdArray : function(array, selector) {
			return "{" + array.select(selector || function(e) { return "object" === typeof e ? e.id : e ; }).join() + "}";
		},
		/**
		 * Default function to convert id of record into int.
		 * @function
		 * @param {Object} e Record
		 */
		convertIdToNumber : function(e) {
			e.id = parseInt(e.id, 10);
		}
	};
	/**
	 * @class Executor used to be passed on chained calls.
	 * @name jaune.db.SqlUtil.Executor
	 * @param {Object} client The SQL client
	 * @param {Function} chainedCallback Callback for executor operations.
	 * @param {Function} close Close function
	 * 
	 */
	function Executor(client, chainedCallback, close) {
		this.client = client;
		this.chainedCallback = chainedCallback;
		this.close = close;
	}
	Executor.prototype = {
		/**
		 * Marks success on this executor.
		 * 
		 * @function
		 * @param {Function} successCallback Callback
		 * @param {*} result Result
		 */
		doSuccess : function(successCallback, result) {
			/**
			 * On finally callback.
			 * @callback
			 */
			function onFinally() {
				successCallback(undefined, result, this.client);
			}
			/**
			 * On commit callback.
			 * @callback
			 */
			function onCommit() {
				this.doFinally(jaune.common.bind(onFinally, this));
			}
			this.client.commit(jaune.common.bind(onCommit, this));
		},
		/**
		 * Marks roll back on this executor.
		 * 
		 * @function
		 * @param {Function} rollbackCallback Callback
		 * @param {*} result Result
		 */
		doRollback : function(rollbackCallback, result) {
			/**
			 * On finally callback.
			 * @callback
			 */
			function onFinally() {
				rollbackCallback(undefined, result, this.client);
			}
			/**
			 * On roll back callback.
			 * @callback
			 * @param {*} [rollbackError] Error
			 */
			function onRollback(rollbackError) {
				this.doFinally(jaune.common.bind(onFinally, this));
			}
			this.client.rollback(jaune.common.bind(onRollback, this));
		},
		/**
		 * Marks error on this executor.
		 * 
		 * @function
		 * @param {Function} catchCallback Callback
		 * @param {*} err Error
		 */
		doError : function(catchCallback, err) {
			/**
			 * On finally callback.
			 * @callback
			 */
			function onFinally() {
				catchCallback(err, undefined, this.client);
			}
			/**
			 * On roll back callback.
			 * @callback
			 * @param {*} [rollbackError] Error
			 */
			function onRollback(rollbackError) {
				err = modules.errorManager.asUnhandledError(rollbackError || err);
				this.doFinally(jaune.common.bind(onFinally, this));
			}
			this.client.rollback(jaune.common.bind(onRollback, this));
		},
		/**
		 * Do finally.
		 * 
		 * @function
		 * @param {Function} catchCallback Callback
		 * @param {*} err Error
		 */
		doFinally : function(cb) {
			this.chainedCallback.end = cb;
			this.close({});
		}
	};
	//begin:	global
	jaune.common.extend(jaune, {
		db : {
			SqlUtil : SqlUtil
		}
	}, false);
	//end:	global
})();