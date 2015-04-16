/**
 * @file Source code for SQL Database query executor. 
 * @author Alvaro Juste
 */

var
errorManager = new jaune.error.ErrorManager();


/**
 * Query executor class that handles results and errors returned
 * by the database.
 * 
 * It unifies different mechanisms for calling and callback.
 * 
 * @constructor Create a new instance of SQL query executor.
 */
var	SqlQueryExecutor = function() {
	
};

SqlQueryExecutor.prototype = {
	/**
	 * 
	 */
	execute : function(client, query, parameters, cb, context, type) {
		
		try {
		    
		    var callback = function(err, results) {
                
                err = errorManager.asUnhandledError(err);
                
                if (cb && (cb.step || cb.end)) {
                    
                    var
                    effectiveCb = (cb.step || cb.end);
                    
                    if (effectiveCb.length == 1) {
                        effectiveCb.call(context || this, {client : client, error : err, result : results});
                    }
                    else {
                        effectiveCb.call(context || this, err, results, client);
                    }
                }
            };
		    switch(type || "query") {
		    
		        case "query" :
		            client.query({ sql : query, args : parameters }, callback);
		            break;
		        case "call" :
                    client.call({ sql : query, args : parameters }, callback);
                    break;
                default :
                    throw new Error("Unsupported type: " + type);
		    }
		}
		catch(error) {
			
			var 
			handledError = errorManager.asUnhandledError(error);
			
			if (cb) {
				if (cb.end) {
					cb.end({client : client, error : handledError});
				}
				if (cb.error) {
					cb.error({client : client, error : handledError});
				}
			}
		}
	}
};
//begin:	global
jaune.common.extend(jaune, {
	db : {
		sql : {
			SqlQueryExecutor : SqlQueryExecutor
		}
	}
}, false);
//end:	global