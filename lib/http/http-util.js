var modules = {
  errorManager : new jaune.error.ErrorManager(),
  fs : new jaune.fs.FileSystemManager(),
  formidable : require('formidable'),
  securityManager : null
}, enums = {
  ListenForDataError : {
    requestEntityTooLarge : 1
  },
  /**
   * Valid HTTP codes.
   *
   * @enumeration
   * @readonly
   * @enum {Number}
   * @name {jaune.http.HttpCode}
   */
  HttpCode : {
    /**
     * Success
     *
     * @constant {Number}
     */
    Ok : 200,
    /**
     * Client must provide a stronger trust level.
     *
     * @constant {Number}
     */
    InsufficientTrustLevel : 280,
    /**
     * Resource has not been modified.
     *
     * @constant {Number}
     */
    NotModified : 304,
    /**
     * Bad request.
     *
     * @constant {Number}
     */
    BadRequest : 400,
    /**
     * Client is not authorized.
     *
     * @constant {Number}
     */
    Unauthorized : 401,
    /**
     * Server refuses to complete request.
     *
     * @constant {Number}
     */
    Fobidden : 403,
    /**
     * Resource not found.
     *
     * @constant {Number}
     */
    NotFound : 404,
    /**
     * Request too big.
     *
     * @constant {Number}
     */
    RequestEntityTooLarge : 413,
    /**
     * Something went wrong inside the server.
     *
     * @constant {Number}
     */
    InternalServerError : 500
  }
};
/**
 * @class Class for HTTP utilities.
 * @name {jaune.http.Util}
 */
function HttpUtil() {
  if (!modules.responseEncoding) {
    modules.responseEncoding = true;
    modules.responseEncoding = new jaune.http.ResponseEncoding();
  }
  if (!modules.cache) {
    modules.cache = true;
    modules.cache = new jaune.http.Cache();
  }
  if (null === modules.securityManager) {
    modules.securityManager = new jaune.security.SecurityManager();
  }
}
/**
 * Prototype
 */
HttpUtil.prototype = {
  /**
   * Parse integer from the request
   *
   * @function
   * @param {*} input The input
   * @returns The parse number
   */
  parseInteger : function(input) {
    var res = parseInt(new Number(input));
    return isNaN(res) ? null : res;
  },
  /**
   * Gets remote address by handling HTTP redirects by proxy.
   *
   * @function
   * @param {Object} req Request
   * @returns {String} Originator address.
   */
  getRemoteAddress : function(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  /**
   * Gets value of a request header.
   *
   * @function
   * @param {Object} req Request
   * @param {String} name Header name.
   * @returns {String} Header value
   */
  getRequestHeader : function(req, name) {
    return req.headers[name] || null;
  },
  /**
   * End request with <b>{jaune.http.HttpCode.InsufficientTrustLevel}</b>
   *
   * @function
   * @param {Object} response HTTP Response
   */
  endWithInsufficientTrustLevel : function(response) {
    this.endWithCode(response, jaune.http.HttpCode.InsufficientTrustLevel);
  },
  /**
   * End request with <b>{jaune.http.HttpCode.Ok}</b>
   *
   * @function
   * @param {Object} response HTTP Response
   * @param {String} body Response body
   */
  endWithSuccess : function(response, body) {
    this.endWithCode(response, jaune.http.HttpCode.Ok, body);
  },
  /**
   * End request with specified code and body.
   *
   * @function
   * @param {Object} response HTTP Response
   * @param {String} body Response body
   * @param {Number} code HTTP code.
   */
  endWithCode : function(response, code, body) {
    response.writeHead(code);
    response.end(body);
  },
  /**
   * End request with <b>{jaune.http.HttpCode.NotFound}</b>
   *
   * @function
   * @param {Object} response HTTP Response
   */
  endWithNotFound : function(response) {
    this.endWithCode(response, enums.HttpCode.NotFound);
  },
  /**
   * End request with <b>{jaune.http.HttpCode.InternalServerError}</b>
   *
   * @function
   * @param {Object} response HTTP Response
   * @param {*} [err] Error
   */
  endWithInternalError : function(response, err) {
    if ("function" === typeof process.app.configuration.error.handler) {
      err = err || {};
      err.statusCode = enums.HttpCode.InternalServerError;
      process.app.configuration.error.handler(err, undefined, response);
    }
    else {
      this.endWithCode(response, enums.HttpCode.InternalServerError);
    }
  },
  /**
   * End request with <b>{jaune.http.HttpCode.RequestEntityTooLarge}</b>
   *
   * @function
   * @param {Object} response HTTP Response
   */
  endWithRequestEntityTooLarge : function(response) {
    this.endWithCode(response, enums.HttpCode.RequestEntityTooLarge);
  },
  /**
   * End request with <b>{jaune.http.HttpCode.Unauthorized}</b>
   *
   * @function
   * @param {Object} response HTTP Response
   */
  endWithUnauthorized : function(response) {
    if ("function" === typeof process.app.configuration.error.handler) {
      process.app.configuration.error.handler({
        statusCode : enums.HttpCode.Unauthorized
      }, undefined, response);
    }
    else {
      this.endWithCode(response, enums.HttpCode.Unauthorized);
    }
  },
  /**
   * End request with <b>{jaune.http.HttpCode.Fobidden}</b>
   *
   * @function
   * @param {Object} response HTTP Response
   */
  endWithForbidden : function(response) {
    this.endWithCode(response, enums.HttpCode.Fobidden);
  },
  /**
   * End request with <b>{jaune.http.HttpCode.BadRequest}</b>
   *
   * @function
   * @param {Object} response HTTP Response
   */
  endWithBadRequest : function(response) {
    this.endWithCode(response, enums.HttpCode.BadRequest);
  },
  /**
   * End request with <b>{jaune.http.HttpCode.NotModified}</b>
   *
   * @function
   * @param {Object} response HTTP Response
   */
  endWithNotModified : function(response) {
    this.endWithCode(response, enums.HttpCode.NotModified);
  },
  /**
   * Sends cache headers so the response is not cached. Header sent are
   * <b>Cache-Control, Expire, Pragma</b>
   *
   * @function
   * @param {Object} response HTTP Response
   */
  sendHeaderNoCache : function(response) {
    response.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    response.setHeader("Expires", new Date(0).toString());
    response.setHeader("Pragma", "no-cache");
  },
  /**
   * Configure response header for expiration. Header sent are <b>Cache-Control,
   * Expire</b>
   *
   * @function
   * @param {Object} response HTTP Response
   * @param {Date} date When response expires.
   */
  sendHeaderExpires : function(response, date) {
    response.setHeader("Expires", date.toString());
    response.setHeader("Cache-Control", "public, max-age=" + date.differenceInSeconds(new Date()));
  },
  /**
   * Gets accepted encoding by request by reading <b>accept-encoding</b>
   *
   * @function
   * @param {Object} request HTTP Request
   * @returns {Array} Encodings
   */
  getHeaderAcceptEncodings : function(request) {
    return (request.headers["accept-encoding"] || "").split(",");
  },
  /**
   * Gets request content type by reading <b>content-type</b>
   *
   * @function
   * @param {Object} request HTTP Request
   * @returns {String} Content type
   */
  getHeaderContentType : function(request) {
    return request.headers["content-type"] || "";
  },
  /**
   * Gets request accepted language by reading <b>accept-language</b>
   *
   * @function
   * @param {Object} request HTTP Request
   * @returns {String} Accepted languages
   */
  getHeaderAcceptLanguage : function(request) {
    return request.headers["accept-language"];
  },
  /**
   * Sends <b>Content-Encoding</b> header.
   *
   * @param {Object} response HTTP response.
   * @param {String} value The value.
   */
  sendHeaderContentEncoding : function(response, encoding) {
    response.setHeader("Content-Encoding", encoding);
  },
  /**
   * Sends <b>Content-Length</b> header.
   *
   * @param {Object} response HTTP response.
   * @param {String} value The value.
   */
  sendHeaderContentLength : function(response, length) {
    response.setHeader("Content-Length", length);
  },
  /**
   * Sends <b>Last-Modified</b> header.
   *
   * @param {Object} response HTTP response.
   * @param {String} value The value.
   */
  sendHeaderLastModified : function(response, value) {
    response.setHeader("Last-Modified", value);
  },
  /**
   * Sends <b>ETag</b> header.
   *
   * @param {Object} response HTTP response.
   * @param {String} value The value.
   */
  sendHeaderEtag : function(response, value) {
    response.setHeader("ETag", value);
  },
  /**
   * Sends <b>Content-Type</b> header.
   *
   * @param {Object} response HTTP response.
   * @param {String} value The value.
   */
  sendHeaderContentType : function(response, value) {
    response.setHeader("Content-Type", value);
  },
  /**
   * Generates Entity tag.
   *
   * @param {Object} stat File system status.
   * @returns {String} The ETag
   */
  generateEtag : function(stat) {
    return stat.size + "-" + Date.parse(stat.mtime);
  },
  processMultipart : function(request, cb) {

    var data = {
      form : null,
      length : 0,
      files : [],
      parts : [],
      form : new modules.formidable.IncomingForm()
    };
    /**
     * Callback when form has been parsed.
     *
     * @param {Object} err Error that might have occurred.
     */
    function onFormParse(err) {

      data.parts.forEach(function(e) {
        e.removeListener('data', onFormPartData);
      });
      data.form.removeListener('fileBegin', onFormFile);
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
     * Callback when a form part is processed.
     *
     * @param part
     */
    function onFormPart(part) {
      if (part.filename) {
        data.parts.push(part);
        part.addListener('data', onFormPartData);
      }
      data.form.handlePart(part);
    }
    /**
     * Callback on part data.
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
      request.removeListener('end', onEnd);

      if (cb) {
        cb(err);
      }
    }
    data.form.onPart = jaune.common.bind(onFormPart, this);
    data.form.on('fileBegin', onFormFile);
    data.form.parse(request, onFormParse);
  },
  sendFile : function(fsModule, opts) {
    /**
     * Checks cache.
     *
     * @param {Object} stat File system status.
     * @param {Function} cb Callback function.
     */
    function checkCache(stat, cb) {
      var result = false, err = null;

      try {
        result = !modules.cache.process({
          response : opts.response,
          request : opts.request
        }, stat);
      }
      catch (ex) {
        err = ex;
      }
      cb(err, result);
    }
    /**
     * Callback after reading a file.
     *
     * @param {Object} err An error
     * @param {Number} result The result of the operation
     * @param {Stream} stream Stream to the file.
     * @param {Object} stat File system status.
     */
    function onFileRead(err, result, stream, stat) {

      var endWithError = false;

      if (err) {
        endWithError = true;
      }
      else {
        switch (result) {
          case jaune.fs.FileSystemManager.ReadResult.Success:

            try {

              this.sendHeaderContentType(opts.response, stat.getMime());
              modules.responseEncoding.process({
                response : opts.response,
                request : opts.request
              }, stream);
            }
            catch (ex) {
              endWithError = true;
              err = ex;
            }

            break;
          case jaune.fs.FileSystemManager.ReadResult.NotFound:
            this.endWithNotFound(opts.response);
            break;
          case jaune.fs.FileSystemManager.ReadResult.InvalidPath:
          case jaune.fs.FileSystemManager.ReadResult.InvalidResourceType:
            this.endWithBadRequest(opts.response);
            break;
          case jaune.fs.FileSystemManager.ReadResult.NotModified:
            this.endWithNotModified(opts.response);
            break;
          default:
            endWithError = true;
            break;
        }
      }
      if (endWithError === true) {
        opts.err = modules.errorManager.asUnhandledError(err);

        if (opts.logger && opts.loggerArgs) {
          modules.errorManager.logErrorOnUnhandledError(opts.err, opts.logger, opts.loggerArgs);
        }
        this.endWithInternalError(opts.response, opts.err);
      }
    }
    modules.fs.read(fsModule, {
      request : opts.request,
      response : opts.response,
      path : opts.path,
      checkCache : checkCache
    }, jaune.common.bind(onFileRead, this));
  },
  /**
   * Handles security validations and errors by replying if necessary.
   *
   * @function
   * @param {Object} res Response object
   * @param {Object} [opts.err] Possible error.
   * @param {jaune.app.security.IsGrantedResult} [opts.result.securityCheck]
   * Validation from a security check.
   * @param {Object} [opts.logger] Logger options.
   * @returns {Boolean} Returns true if replied.
   */
  handleResponseAsDefault : function(opts) {

    var handled = false, clearData = false;

    opts = opts || {};
    opts.result = opts.result || {};

    if ("boolean" === typeof opts.clearData && true === opts.clearData && "undefined" !== typeof opts.result.data) {
      clearData = true;
    }

    if (opts.err) {
      this.handleServiceError(opts);
      handled = true;
    }
    else if ("number" === typeof opts.result.securityCheck) {

      switch (opts.result.securityCheck) {

        case jaune.security.IsGrantedResult.Yes:
          handled = false;
          break;

        case jaune.security.IsGrantedResult.InsufficientTrustLevel:

          this.endWithInsufficientTrustLevel(opts.response);
          handled = true;
          break;

        case jaune.security.IsGrantedResult.No:
        default:

          this.endWithUnauthorized(opts.response);
          handled = true;
          break;
      }
    }
    if (!handled) {

      if ("boolean" === typeof opts.sendNotFoundOnNoData && true === opts.sendNotFoundOnNoData && !opts.result.data) {
        if (clearData) {
          opts.result.data = undefined;
        }
        this.endWithNotFound(opts.response);
        handled = true;
      }
      else if ("boolean" === typeof opts.endOnSuccess && true === opts.endOnSuccess) {
        if (clearData) {
          opts.result.data = undefined;
        }
        else if (true === opts.stringifyData) {
          opts.result.data = JSON.stringify(opts.result.data);
        }
        this.handleServiceSuccess({
          response : opts.response,
          data : opts.result.data
        });
        handled = true;
      }
    }
    return handled;
  },
  handleServiceError : function(opts) {

    var isArgumentError = opts.err instanceof jaune.error.ArgumentError;
    /**
     * On query finished callback
     */
    function end() {
      if (opts.dontFinishResponse !== true) {
        this.endWithCode(
          opts.response,
          isArgumentError ?
            enums.HttpCode.BadRequest :
            enums.HttpCode.InternalServerError);
      }
    }
    opts.err = modules.errorManager.asUnhandledError(opts.err);

    if (opts.logger && opts.loggerArgs) {
      modules.errorManager.logErrorOnUnhandledError(opts.err, opts.logger, opts.loggerArgs);
    }
    if (opts.client) {
      opts.client.rollbackAndClose(end);
    }
    else {
      end.call(this);
    }
  },
  handleServiceSuccess : function(opts) {
    /**
     * On query finished callback
     *
     * @param {Object} err Error
     */
    function end(err) {
      if (opts.dontFinishResponse !== true) {
        this.endWithSuccess(opts.response, opts.data);
      }
    }
    if (opts.client) {
      if (opts.rollback === true) {
        opts.client.rollbackAndClose(jaune.common.bind(end, this));
      }
      else {
        opts.client.commitAndClose(jaune.common.bind(end, this));
      }
    }
    else {
      end.call(this);
    }
  },
  handleServiceSucessWithPage : function(opts) {
    opts.dontFinishResponse = true;
    this.handleServiceSuccess(opts);
    opts.response.render(opts.page, opts.pageArgs);
  },
  getLanguageChange : function(opts) {
    return "GET" === opts.request.method && "string" === typeof opts.request.query.lng && 2 === opts.request.query.lng.length && opts.localeManager.isSupportedLanguage(opts.request.query.lng) ? opts.request.query.lng : null;
  },
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
  }
};
// begin: global
jaune.common.extend(jaune, {
  http : {
    Util : HttpUtil,
    HttpCode : enums.HttpCode
  }
}, false);
// end: global
