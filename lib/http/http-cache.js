(function() {
	
	"use strict";
	
	var
	modules = {
		env : new jaune.env.Environment()
	},
	settings = {
		http : modules.env.getModulesSettings().http
	};
	/**
	 * 
	 */
	function HttpCache() { 
		if (!modules.httpUtil) {
			modules.httpUtil = new jaune.http.Util();
		}
	}
	/**
	 * 
	 */
	HttpCache.prototype = {
		/**
		 * Process http cache.
		 * 
		 * @param {Object} opts Options
		 * @param {Object} stat File system status
		 */
		process : function(opts, stat) {
			var
			cache = settings.http.cache.enabled,
			etag = modules.httpUtil.generateEtag(stat),
			resend = opts.noCache === true || cache === false || opts.request.headers['if-none-match'] !== etag;
			
			if (opts.noCache === true) {
				modules.httpUtil.sendHeaderNoCache(opts.response);
			}
			else if (resend) {
				if (cache) {
					modules.httpUtil.sendHeaderLastModified(opts.response, stat.mtime);
					modules.httpUtil.sendHeaderEtag(opts.response, etag);		
					modules.httpUtil.sendHeaderExpires(opts.response, new Date().addDays(opts.longLasting ? 365 : 1));
				}
			}
			else {
				modules.httpUtil.sendHeaderLastModified(opts.response, stat.mtime);
			}
			return resend;
		}
	};
	//begin: global
	jaune.common.extend(jaune, {
		http : {
			Cache : HttpCache
		}
	}, false);
	//end: global
})();