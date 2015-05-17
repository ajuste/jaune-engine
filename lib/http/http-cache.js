(function() {

  "use strict";

  var Environment = require("../server/environment").get();
  var Settings    = Environment.getModulesSettings().http.cache;
  /**
   * @class Http Class
   */
  var HttpCache = function() {};
  /**
   * Prototype
   */
  HttpCache.prototype = {
    /**
     * @function Get http util
     */
     __getHttpUtil : function() {
       return this.httpUtil || (this.httpUtil = require("./http-util").Util);
     },
    /**
     * @function Process http cache.
     * @param {Object} opts Options
     * @param {Object} stat File system status
     */
    process : function(opts, stat) {

      var httpUtil = this.__getHttpUtil();
      var cache    = Settings.enabled;
      var etag     = httpUtil.generateEtag(stat);
      var resend   = opts.noCache === true || cache === false || opts.request.headers['if-none-match'] !== etag;

      if (opts.noCache === true) {
        httpUtil.sendHeaderNoCache(opts.response);
      }
      else if (resend) {
        if (cache) {
          httpUtil.sendHeaderLastModified(opts.response, stat.mtime);
          httpUtil.sendHeaderEtag(opts.response, etag);
          httpUtil.sendHeaderExpires(opts.response, new Date().addDays(opts.longLasting ? 365 : 1));
        }
      }
      else {
        httpUtil.sendHeaderLastModified(opts.response, stat.mtime);
      }
      return resend;
    }
  };
  module.exports = {
    Cache : new HttpCache()
  };
})();
