(function() {

  "use strict";

  var Zlib        = require("zlib");
  var Environment = require("../server/environment").get();
  var Settings    = Environment.getModulesSettings().http;
  var Compressors = [];

  //  set compressor if settings are enabled.
  if (Settings.compression.enabled === true) {
    Compressors.push({
      encoding : 'gzip',
      compressor : Zlib.createGzip
    });
    Compressors.push({
      encoding : 'deflate',
      compressor : Zlib.createDeflate
    });
  }
  /**
   * @class Http response encoding
   */
  var HttpResponseEncoding = function() {};
  /**
   * Prototype
   */
  HttpResponseEncoding.prototype = {
    /**
     * @function Get http util
     */
     __getHttpUtil : function() {
       return this.httpUtil || (this.httpUtil = require("./http-util").Util);
     },
    /**
     * @function Get compressor
     * @param [Array] encodings Acceptable encodings
     * @returns {Object} The compressor or null
     */
    __getCompressor : function(encodings) {
      for (var _index = 0, _length = Compressors.length; _index < _length; _index++) {
        if (encodings.indexOf(Compressors[_index].encoding) !== -1)
        {
          return Compressors[_index];
        }
      }
      return null;
    },
    /**
     * @function Process HTTP encoding.
     * @param {Object} opts Options
     * @param {Object} stat File system status
     */
    process : function(opts, stream) {

      var httpUtil = this.__getHttpUtil();
      var kompressor = this.__getCompressor(httpUtil.getHeaderAcceptEncodings(opts.request));
      var result = stream;

      if (kompressor !== null) {
        result = kompressor.compressor();
        httpUtil.sendHeaderContentEncoding(opts.response, kompressor.encoding);
        stream.pipe(result).pipe(opts.response);
      }
      else {
        stream.pipe(opts.response);
      }
      return result;
    }
  };
  module.exports = {
    ResponseEncoding : new HttpResponseEncoding()
  };
})();
