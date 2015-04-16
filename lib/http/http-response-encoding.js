(function() {
	
	"use strict";
	
	var
	modules = {
		env : new jaune.env.Environment(),
		zlib : require('zlib')
	},
	settings = {
		http : modules.env.getModulesSettings().http
	},
	compressors = [];
	
	//	set compressor if settings are enabled.
	if (settings.http.compression.enabled === true) {
		compressors.push({ 
			encoding : 'gzip', 
			compressor : modules.zlib.createGzip
		});
		compressors.push({ 
			encoding : 'deflate', 
			compressor : modules.zlib.createDeflate
		});	
	}
	/**
	 * 
	 */
	function HttpResponseEncoding() { 
		if (!modules.httpUtil) {
			modules.httpUtil = new jaune.http.Util();
		} 
	}
	/**
	 * 
	 */
	HttpResponseEncoding.prototype = {
		/**
		 * 
		 * @param encodings
		 * @returns
		 */
		getCompressor : function(encodings) {
			for (var index = 0; index < compressors.length; index++) {
				if (encodings.indexOf(compressors[index].encoding) !== -1) 
				{
					return compressors[index];
				}
			}
			return null;
		},
		/**
		 * Process HTTP encoding.
		 * 
		 * @param {Object} opts Options
		 * @param {Object} stat File system status
		 */
		process : function(opts, stream) {
			var
			kompressor = this.getCompressor(modules.httpUtil.getHeaderAcceptEncodings(opts.request)),
			result = stream;
			
			if (kompressor !== null) {
				result = kompressor.compressor();
				modules.httpUtil.sendHeaderContentEncoding(opts.response, kompressor.encoding);
				stream.pipe(result).pipe(opts.response);
			}
			else {
				stream.pipe(opts.response);
			}
			return result;
		}
	};
	//begin: global
	jaune.common.extend(jaune, {
		http : {
			ResponseEncoding : HttpResponseEncoding
		}
	}, false);
	//end: global
})();