/**
 * @file Source code for Http utility.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var _            = require("underscore");
  var Error        = require("../error/errors");
  var ErrorManager = require("../error/error-manager").Manager;
  var Fs           = require("../filesystem/filesystem-manager");
  var FSManager    = Fs.Manager;
  var Formidable   = require("formidable");
  var Security     = require("../security/security");
  var Encoding     = require("./http-response-encoding").ResponseEncoding;
  var Cache        = require("./http-cache").Cache;
  var Enums        = {
    /**
     * @enumeration Errors on receiving data
     * @readonly
     * @enum {Number}
     */
    ListenForDataError : {
      /**
       * @constant {Number} Request entity is too big
       */
      requestEntityTooLarge : 1
    },
    /**
     * @enumeration Valid HTTP codes.
     * @readonly
     * @enum {Number}
     */
    HttpCode : {
      /**
       * @constant {Number} Success
       */
      Ok : 200,
      /**
       * @constant {Number} Client must provide a stronger trust level.
       */
      InsufficientTrustLevel : 280,
      /**
       * @constant {Number} Resource has not been modified.
       */
      NotModified : 304,
      /**
       * @constant {Number} Bad request.
       */
      BadRequest : 400,
      /**
       * @constant {Number} Client is not authorized.
       */
      Unauthorized : 401,
      /**
       * @constant {Number} Server refuses to complete request.
       */
      Fobidden : 403,
      /**
       * @constant {Number} Resource not found.
       */
      NotFound : 404,
      /**
       * @constant {Number}Request too big.
       */
      RequestEntityTooLarge : 413,
      /**
       * @constant {Number} Something went wrong inside the server.
       */
      InternalServerError : 500
    }
  };
  var __bindeableDefaulResponse = function* (logger, res, operation, moduleName, err, result, flags) {

    flags = flags || {};

    return yield this.handleResponseAsDefault({
      endOnSuccess : flags.endOnSuccess,
      clearData : flags.clearData,
      stringifyData : flags.stringifyData,
      result : result,
      response : res,
      err : err,
      logger : logger,
      loggerArgs : {
        module : moduleName,
        operation : operation,
        message : err
      }
    });
  };
  /**
   * @class Class for HTTP utilities.
   */
  var HttpUtil = function () {};
  /**
   * Prototype
   */
  HttpUtil.prototype = {
    /**
     * @function Parse integer from the request
     * @param {*} input The input
     * @returns The parse number
     */
    parseInteger : function(input) {
      var res = parseInt(new Number(input));
      return isNaN(res) ? null : res;
    },
    /**
     * @function Gets remote address by handling HTTP redirects by proxy.
     * @param {Object} req Request
     * @returns {String} Originator address.
     */
    getRemoteAddress : function(req) {
      return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    },
    /**
     * @function Gets value of a request header.
     * @param {Object} req Request
     * @param {String} name Header name.
     * @returns {String} Header value
     */
    getRequestHeader : function(req, name) {
      return req.headers[name] || null;
    },
    /**
     * @function End request with <b>{HttpCode.InsufficientTrustLevel}</b>
     * @param {Object} response HTTP Response
     */
    endWithInsufficientTrustLevel : function(response) {
      this.endWithCode(response, Enums.HttpCode.InsufficientTrustLevel);
    },
    /**
     * @function End request with <b>{HttpCode.Ok}</b>
     * @param {Object} response HTTP Response
     * @param {String} body Response body
     */
    endWithSuccess : function(response, body) {
      this.endWithCode(response, Enums.HttpCode.Ok, body);
    },
    /**
     * @function End request with specified code and body.
     * @param {Object} response HTTP Response
     * @param {String} body Response body
     * @param {Number} code HTTP code.
     */
    endWithCode : function(response, code, body) {
      response.body = body;
      response.status = code;
    },
    /**
     * @function End request with <b>{HttpCode.NotFound}</b>
     * @param {Object} response HTTP Response
     */
    endWithNotFound : function(response) {
      this.endWithCode(response, Enums.HttpCode.NotFound);
    },
    /**
     * @function End request with <b>{HttpCode.InternalServerError}</b>
     * @param {Object} response HTTP Response
     * @param {*} [err] Error
     */
    endWithInternalError : function(response, err) {
      if ("function" === typeof process.app.configuration.error.handler) {
        err = err || {};
        err.statusCode = Enums.HttpCode.InternalServerError;
        process.app.configuration.error.handler(err, undefined, response);
      }
      else {
        this.endWithCode(response, Enums.HttpCode.InternalServerError);
      }
    },
    /**
     * @function End request with <b>{HttpCode.RequestEntityTooLarge}</b>
     * @param {Object} response HTTP Response
     */
    endWithRequestEntityTooLarge : function(response) {
      this.endWithCode(response, Enums.HttpCode.RequestEntityTooLarge);
    },
    /**
     * @function End request with <b>{HttpCode.Unauthorized}</b>
     * @param {Object} response HTTP Response
     */
    endWithUnauthorized : function(response) {
      if ("function" === typeof process.app.configuration.error.handler) {
        process.app.configuration.error.handler({
          statusCode : Enums.HttpCode.Unauthorized
        }, undefined, response);
      }
      else {
        this.endWithCode(response, Enums.HttpCode.Unauthorized);
      }
    },
    /**
     * @function End request with <b>{HttpCode.Fobidden}</b>
     * @param {Object} response HTTP Response
     */
    endWithForbidden : function(response) {
      this.endWithCode(response, Enums.HttpCode.Fobidden);
    },
    /**
     * @function End request with <b>{HttpCode.BadRequest}</b>
     * @param {Object} response HTTP Response
     */
    endWithBadRequest : function(response) {
      this.endWithCode(response, Enums.HttpCode.BadRequest);
    },
    /**
     * @function End request with <b>{HttpCode.NotModified}</b>
     * @param {Object} response HTTP Response
     */
    endWithNotModified : function(response) {
      this.endWithCode(response, Enums.HttpCode.NotModified);
    },
    /**
     * @function Sends cache headers so the response is not cached. Header sent are
     * <b>Cache-Control, Expire, Pragma</b>
     * @param {Object} response HTTP Response
     */
    sendHeaderNoCache : function(response) {
      response.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      response.set("Expires", new Date(0).toString());
      response.set("Pragma", "no-cache");
    },
    /**
     * @function Configure response header for expiration. Header sent are <b>Cache-Control,
     * Expire</b>
     * @param {Object} response HTTP Response
     * @param {Date} date When response expires.
     */
    sendHeaderExpires : function(response, date) {
      response.set("Expires", date.toString());
      response.set("Cache-Control", "public, max-age=" + date.differenceInSeconds(new Date()));
    },
    /**
     * @function Gets accepted encoding by request by reading <b>accept-encoding</b>
     * @param {Object} request HTTP Request
     * @returns {Array} Encodings
     */
    getHeaderAcceptEncodings : function(request) {
      return (request.headers["accept-encoding"] || "").split(",");
    },
    /**
     * Gets request content type by reading <b>content-type</b>
     * @param {Object} request HTTP Request
     * @returns {String} Content type
     */
    getHeaderContentType : function(request) {
      return request.headers["content-type"] || "";
    },
    /**
     * @function Gets request accepted language by reading <b>accept-language</b>
     * @param {Object} request HTTP Request
     * @returns {String} Accepted languages
     */
    getHeaderAcceptLanguage : function(request) {
      return request.headers["accept-language"];
    },
    /**
     * @function Sends <b>Content-Encoding</b> header.
     * @param {Object} response HTTP response.
     * @param {String} value The value.
     */
    sendHeaderContentEncoding : function(response, encoding) {
      response.set("Content-Encoding", encoding);
    },
    /**
     * @function Sends <b>Content-Length</b> header.
     * @param {Object} response HTTP response.
     * @param {String} value The value.
     */
    sendHeaderContentLength : function(response, length) {
      response.set("Content-Length", length);
    },
    /**
     * @function Sends <b>Last-Modified</b> header.
     * @param {Object} response HTTP response.
     * @param {String} value The value.
     */
    sendHeaderLastModified : function(response, value) {
      response.set("Last-Modified", value);
    },
    /**
     * @function Sends <b>ETag</b> header.
     * @param {Object} response HTTP response.
     * @param {String} value The value.
     */
    sendHeaderEtag : function(response, value) {
      response.set("ETag", value);
    },
    /**
     * @function Sends <b>Content-Type</b> header.
     * @param {Object} response HTTP response.
     * @param {String} value The value.
     */
    sendHeaderContentType : function(response, value) {
      response.set("Content-Type", value);
    },
    /**
     * @function Generates Entity tag.
     * @param {Object} stat File system status.
     * @returns {String} The ETag
     */
    generateEtag : function(stat) {
      return stat.size + "-" + Date.parse(stat.mtime);
    },
    processMultipart : function(request, cb) {

      var data = {
        length : 0,
        files : [],
        parts : [],
        form : new Formidable.IncomingForm()
      };
      /**
       * @callback Callback when form has been parsed.
       * @param {Object} err Error that might have occurred.
       */
      function onFormParse(err) {

        data.parts.forEach(function(e) {
          e.removeListener("data", onFormPartData);
        });
        data.form.removeListener("fileBegin", onFormFile);
        data.form.onPart = undefined;
        data.parts.length = 0;

        delete data.parts;
        delete data.form;

        if (err) {
          data.files.length = 0;
          delete data.files;
          data = null;
        }
        else {
          request.files = data.files;
        }
        onEnd(err);
      }
      /**
       * @param name
       * @param file
       */
      function onFormFile(name, file) {
        data.files.push({
          data : [],
          type : file.type,
          name : file.name,
          lastModifiedDate : file.lastModifiedDate,
          hash : file.hash
        });
      }
      /**
       * @functionCallback when a form part is processed.
       * @param part
       */
      function onFormPart(part) {
        if (part.filename) {
          data.parts.push(part);
          part.addListener("data", onFormPartData);
        }
        data.form.handlePart(part);
      }
      /**
       * @function Callback on part data.
       */
      function onFormPartData(partData) {

        data.length += partData.length;
        data.files.last().data.push(partData);

        /*
         * if (settings.http.request.mixSize < data.length) {
         * this.endWithRequestEntityTooLarge(response); onFormParse("Request
         * Entity Too Large"); }
         */
      }
      /**
       * @param err
       */
      function onEnd(err) {
        data = null;
        request.removeListener("end", onEnd);

        if (cb) {
          cb(err);
        }
      }
      data.form.onPart = _.bind(onFormPart, this);
      data.form.on("fileBegin", onFormFile);
      data.form.parse(request, onFormParse);
    },
    /**
    * @function Checks cache.
    * @param    {Object} stat File system status.
    * @param    {Function} cb Callback function.
    */
    checkCache : function(opts, stat) {
      return  !Cache.process({
                response : opts.response,
                request : opts.request
              }, stat);
    },
    sendFile : function* (fsModule, opts) {

      const result =  yield FSManager.read(fsModule, {
                        request : opts.request,
                        response : opts.response,
                        path : opts.path,
                        checkCache : _.bind(this.checkCache, this, opts)
                      });

      switch (result.code) {

        case Fs.ReadResult.Success:
          this.sendHeaderContentType(opts.response, result.stat.getMime());
          opts.response.body = result.stream;
          break;

        case Fs.ReadResult.NotFound:
          return this.endWithNotFound(opts.response);

        case Fs.ReadResult.InvalidPath:
        case Fs.ReadResult.InvalidResourceType:
          return this.endWithBadRequest(opts.response);

        case Fs.ReadResult.NotModified:
          return this.endWithNotModified(opts.response);

        default :
          throw new Error("Unsupported read file code: " + result.code);
      }
    },
    handleResponseOnAuth : function* (opts) {
      let clearData     = true === opts.clearData && dataAvailable;
      if (true === opts.sendNotFoundOnNoData && !opts.result.data) {
        if (clearData) {
          opts.result.data = undefined;
        }
        this.endWithNotFound(opts.response);
      }
      else if (true === opts.endOnSuccess) {
        if (!clearData && true === opts.stringifyData) {
          opts.result.data = JSON.stringify(opts.result.data);
        }
        yield this.handleServiceSuccess({
          response : opts.response,
          data : clearData ? "" : opts.result.data
        });
        return true;
      }
      else {
        return false;
      }
      return true;
    },
    /**
     * @function Handles security validations and errors by replying if necessary.
     * @param    {Object} res Response object
     * @param    {Object} [opts.err] Possible error.
     * @param    {Security.IsGrantedResult} [opts.result.securityCheck] Validation from a security check.
     * @param    {Object} [opts.logger] Logger options.
     * @returns  {Boolean} Returns true if replied.
     */
    handleResponseAsDefault : function* (opts) {
      opts = _.defaults(opts || {}, { result : {} });

      let dataAvailable = !_.isUndefined(opts.result.data);

      if (opts.err) {
        yield this.handleServiceError(opts);
      }
      else if (_.isNumber(opts.result.securityCheck)) {

        switch (opts.result.securityCheck) {

          case Security.IsGrantedResult.Yes:
            return yield this.handleResponseOnAuth(opts);

          case Security.IsGrantedResult.InsufficientTrustLevel:
            this.endWithInsufficientTrustLevel(opts.response);
            break;

          case Security.IsGrantedResult.No:
          default:
            this.endWithUnauthorized(opts.response);
            break;
        }
      }
      else {
        return yield this.handleResponseOnAuth(opts);
      }
      return true;
    },
    handleServiceError : function* (opts) {

      let isArgumentError = opts.err instanceof Error.ArgumentError;

      opts.err = ErrorManager.asUnhandledError(opts.err);

      if (opts.logger && opts.loggerArgs) {
        yield ErrorManager.logErrorOnUnhandledError(opts.err, opts.logger, opts.loggerArgs);
      }
      if (opts.client) {
        yield opts.client.rollbackAndClose(end);
      }
      if (opts.dontFinishResponse !== true) {
        this.endWithCode(opts.response,
          isArgumentError ?
            Enums.HttpCode.BadRequest :
            Enums.HttpCode.InternalServerError);
      }
    },
    handleServiceSuccess : function* (opts) {
      if (opts.dontFinishResponse !== true) {
        this.endWithSuccess(opts.response, opts.data);
      }
      if (!opts.client) {
        return;
      }
      if (opts.rollback === true) {
        yield opts.client.rollbackAndClose();
      }
      else {
        yield opts.client.commitAndClose();
      }
    },
    handleServiceSucessWithPage : function(opts) {
      opts.dontFinishResponse = true;
      this.handleServiceSuccess(opts);
      opts.response.render(opts.page, opts.pageArgs);
    },
    /**
     * @function Gets language that is being changed.
     * @param {Object} opts.request The request
     * @param {Object} opts.localeManager Locale manager
     * @returns {String} The language beign changed or null
     */
    getLanguageChange : function(opts) {
      return "GET" === opts.request.method &&
             "string" === typeof opts.request.query.lng &&
             2 === opts.request.query.lng.length &&
             opts.localeManager.isSupportedLanguage(opts.request.query.lng) ? opts.request.query.lng : null;
    },
    /**
     * @function Sets up the request with basic data such as language
     * @param {Object} opts.request The request
     * @param {Object} opts.localeManager Locale manager
     */
    setupRequest : function(opts, cb) {

      var languageChange = null;

      try {

        if (opts.request.session && !opts.request.session.userId) {
          opts.request.session.userId = 0;
        }

        if (null !== (languageChange = this.getLanguageChange(opts)) || !opts.request.session.locale) {
          opts.request.session.locale = opts.localeManager.getLocale(languageChange);
        }
        opts.localeManager.setLocale(opts.request.session.locale, function() {
          opts.request.locale = opts.request.session.locale.locale;
          cb();
        });
      }
      catch (ex) {
        opts.loggerArgs = opts.loggerArgs || {};
        opts.loggerArgs.message = ex;
        opts.err = ex;
        opts.dontFinishResponse = true;
        this.handleServiceError(opts);
        cb();
      }
    },
    /**
     * @function Bind default service response to constant parameters
     * @param {Object} logger The logger
     * @param {Object} res The response
     * @param {String} operation The operation
     * @param {String} moduleName The module name
     */
    bindDefaultResponse : function (logger, res, operation, moduleName) {
      return _.bind(__bindeableDefaulResponse, this, logger, res, operation, moduleName);
    }
  };
  module.exports = {
    Util : new HttpUtil(),
    HttpCode : Enums.HttpCode
  };
})();
