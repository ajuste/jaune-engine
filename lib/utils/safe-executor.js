/**
 * @file Source code for Safe Executor.
 * @author Alvaro Juste
 */

(function() {
	
	"use strict";
	/**
	 * Executes with wtry
	 * @function
	 * @param {Function} fn What to be executed.
	 * @callbacks {Object} Callbacks
	 */
	function executeWithTry(fn, callbacks) {
		try {
			var
			result = fn();
		
			if (typeof callbacks.success === 'function'){
				callbacks.success(result);
			}
		}
		catch(err) {
			if (typeof callbacks.error === 'function'){
				callbacks.error(err);
			}
		}
	}
	/**
	 * @class Safe executor.
	 * @name {jaune.common.reliability.SafeExecutor}
	 */
	function SafeExecutor() {}
	
	SafeExecutor.prototype = {
		
		execute : function(fn, callbacks, async) {
			callbacks = callbacks || {};
			
			if (async){
				process.nextTick(function(){
					executeWithTry(fn, callbacks, async);
				});
			}
			else {
				executeWithTry(fn, callbacks, async);
			}
		}
	};
	jaune.common.extend(jaune, {
		common : {
			reliability : {
				SafeExecutor : SafeExecutor
			}
		}
	}, false);
})();