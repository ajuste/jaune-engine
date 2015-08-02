/**
 * @file Source code Koa application
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  const _              = require("underscore");
  const Koa            = require("koa");
  const I18n           = require("i18next");
  const KoaBody        = require("koa-body");
  const Logger         = require("koa-logger");
  const Routing        = require("koa-routing");
  const KoaLocale      = require("koa-locale");
  const Jade           = require("koa-jade");
  const Send           = require("koa-send");
  const Http           = require("http");
  const Path           = require("path");
  const Reflection     = require("../utils/reflection").Reflection;
  const HttpUtil       = require("../http/http-util").Util;
  const LocaleManager  = require("../localization/locale").LocaleManager;
  const LoggingManager = require("../logging/logging-manager").LoggingManager;
  const ModuleName     = "server/Koa";
  const LoggerCore     = LoggingManager.instance("core");
  let   Environment    = null;
  let   SettingsLocale = null;
  let   SettingsFS     = null;
  let   SettingsCsrf   = false;

  /**
   * @class Represents the server. Handles initialization and finalize.
   * @param {Object} configuration Configuration
   */
  const KoaServer = function(configuration) {
    if (!Environment) {
      Environment = require("../server/environment").get();
      SettingsLocale = Environment.getLocale();
      SettingsFS = Environment.getLocale();
    }
    this.configuration = configuration;
    this.app = Koa();
  };
  /**
   * Koa prototype
   */
  KoaServer.prototype = {
    /**
     * @function Sets up modules to be used by the server.
     * @returns Nothing
     */
    setupModules : function() {

      this.app.env  = process.env.type;
      this.app.port = process.env.PORT || this.configuration.web.port || 3000;
      this.app.configuration = this.configuration;
      this.app.keys = ["some secret hurr"] // TODO: MAke it configurable

      if (_.isObject(this.configuration.i18n)) {
        KoaLocale(this.app);
        this.app.use(function* (next) {
          const locale = this.getLocaleFromQuery() || this.getLocaleFromCookie();
          if (locale) {
            yield LocaleManager.setLocale(locale);
            HttpUtil.setCookieValue(this, "locale", locale, "1year");
          }
          yield next;
        });
      }

      //
      if ("development" === process.env.type) {
        this.app.use(Logger());
      }
      if (true === this.configuration.web.session) {
        var sessionConfig = this.configuration.web.sessionConfig;
        this.app.use(Reflection.callByName(sessionConfig.store.constructor, sessionConfig.store.arguments, sessionConfig.store.context, {app : this.app }));
      }
      this.app.use(Jade.middleware({
        viewPath: this.configuration.web.view.path,
        debug: true,
        pretty: false,
        compileDebug: true
      }));
      this.app.use(KoaBody({
        strict : true,
        multipart : true,
        formidable: {
          uploadDir: Path.join(process.cwd(), "temp", "uploads")
        }
      }));
      this.app.use(Routing(this.app));

      if ("string" === typeof this.configuration.web.favicon) {
        //this.app.use(Koa.favicon(this.configuration.web.favicon));
      }
      if (true === this.configuration.web.json) {
        //this.app.use(Koa.json());
      }
      if (true === this.configuration.web.urlencoded) {
        //this.app.use(Koa.urlencoded());
      }
      if (true === this.configuration.web.methodOverride) {
        //this.app.use(Koa.methodOverride());
      }
      if (true === this.configuration.web.cookieParser) {
        //this.app.use(Koa.cookieParser());
      }
  //    if (!_.isUndefined(this.configuration.web)) {
    //  }
      /*this.app.use(function(req, res, next) {

        function cb() {
          if (HttpUtil.getHeaderContentType(req).indexOf("multipart/form-data") === 0) {
            HttpUtil.processMultipart(req, multipart);
          }
          else {
            multipart();
          }
        }
        function multipart() {
          next();
        }
        if (SettingsCsrf && req.csrfToken) {
          res.cookie("x-csrf-token", req.csrfToken());
        }
        if (req.session) {
          HttpUtil.setupRequest({ request : req, response : res, LocaleManager : LocaleManager, logger : LoggerCore, loggerArgs : { module : ModuleName, operation : "onRequest" }}, cb);
        }
        else {
          cb();
        }
      });*/
      //this.app.use(this.app.router);
      //this.app.disable("x-powered-by"); // for security reasons.

      if (true === this.configuration.static) {
        let path = this.configuration.staticConfig.path;
        this.app.use(function *(){
          yield Send(this, this.path, { root: path, maxAge : SettingsFS.maxAge });
        });
      }

      //  default route
      if ("function" === typeof this.configuration.web.routes.defaultRouter) {
        //this.app.use(this.configuration.web.routes.defaultRouter);
      }
      //  error handling
      if ("function" === typeof this.configuration.error.handler) {
      //  this.app.use(this.configuration.error.handler);
      }
      //i18n
      I18n.init({ fallbackLng: SettingsLocale.defaultLanguage, debug : SettingsLocale.debug });
    },
    /**
     * Initialize the server.
     *
     * @function
     */
    init : function() {

      var self = this;

      this.setupModules();
      this.configuration.init.setupRoutes(this.app);
      this.configuration.init.initDeamons();
      Http.createServer(this.app.callback()).listen(this.app.port, function(){
        console.log(self.configuration.appName + " server started");
      });
    }
  };
  module.exports = KoaServer;
})();
