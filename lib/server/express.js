/**
 * @file Source code express application
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  var Express        = require("express");
  var Http           = require("http");
  var Path           = require("path");
  var I18n           = require("i18next");
  var Reflection     = require("../utils/reflection").Reflection;
  var HttpUtil       = require("../http/http-util").Util;
  var LocaleManager  = require("../localization/locale").LocaleManager;
  var LoggingManager = require("../logging/logging-manager").LoggingManager;
  var ModuleName     = "server/express";
  var Environment    = null;
  var SettingsLocale = null;
  var SettingsFS     = null;
  var SettingsCsrf   = false;
  var LoggerCore     = LoggingManager.instance("core");

  /**
   * @class Represents the server. Handles initialization and finalize.
   * @param {Object} configuration Configuration
   */
  var ExpressServer = function(configuration) {
    if (!Environment) {
      Environment = require("../server/environment").get();
      SettingsLocale = Environment.getLocale();
      SettingsFS = Environment.getLocale();
    }
    this.configuration = configuration;
    this.app = Express();
  };
  /**
   * Express prototype
   */
  ExpressServer.prototype = {
    /**
     * Sets up modules to be used by the server.
     * @function
     * @returns Nothing
     */
    setupModules : function() {

      this.app.set("env", process.env.type);
      this.app.set("port", process.env.PORT || this.configuration.web.port || 3000);
      this.app.set("views", this.configuration.view.path);
      this.app.set("view engine", this.configuration.view.engine);
      this.app.use(I18n.handle);

      if ("development" === process.env.type) {
        this.app.use(Express.logger("dev"));
      }
      if ("string" === typeof this.configuration.web.favicon) {
        this.app.use(Express.favicon(this.configuration.web.favicon));
      }
      if (true === this.configuration.web.json) {
        this.app.use(Express.json());
      }
      if (true === this.configuration.web.urlencoded) {
        this.app.use(Express.urlencoded());
      }
      if (true === this.configuration.web.methodOverride) {
        this.app.use(Express.methodOverride());
      }
      if (true === this.configuration.web.cookieParser) {
        this.app.use(Express.cookieParser());
      }
      if (true === this.configuration.web.session) {

        var sessionConfig = this.configuration.web.sessionConfig;

        this.app.use(Express.session({
          secret : sessionConfig.secret,
          key : sessionConfig.key,
          cookie : sessionConfig.cookie,
          store : Reflection.createInstance(sessionConfig.store.constructor, sessionConfig.store.arguments, sessionConfig.store.context)
        }));
      //  this.app.use(Express.csrf());
      //  SettingsCsrf = true;
      }
      this.app.use(function(req, res, next) {

        function cb() {
          if (HttpUtil.getHeaderContentType(req).indexOf("multipart/form-data") === 0) {
            HttpUtil.processMultipart(req, multipart);
          }
          else {
            multipart();
          }
        }
        /**
         * Finished multiple part processing
         * @callback
         */
        function multipart() {
          next();
        }
        if (SettingsCsrf && req.csrfToken) {
          res.cookie("x-csrf-token", req.csrfToken());
        }
        if (req.session) {
          HttpUtil.setupRequest({ request : req, response : res, localeManager : LocaleManager, logger : LoggerCore, loggerArgs : { module : ModuleName, operation : "onRequest" }}, cb);
        }
        else {
          cb();
        }
      });
      this.app.use(this.app.router);
      this.app.disable("x-powered-by"); // for security reasons.

      if (true === this.configuration.static) {
        this.app.use(Express.static(this.configuration.staticConfig.path, { maxAge : SettingsFS.maxAge }));
      }

      //  default route
      if ("function" === typeof this.configuration.web.routes.defaultRouter) {
        this.app.use(this.configuration.web.routes.defaultRouter);
      }
      //  error handling
      if ("function" === typeof this.configuration.error.handler) {
        this.app.use(this.configuration.error.handler);
      }

      //  i18n
      I18n.init({ useCookie : true, fallbackLng: SettingsLocale.defaultLanguage, debug : SettingsLocale.debug, cookieName : "lng", detectLngQS : "lng" });
      I18n.registerAppHelper(this.app);
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

      //  initialize server
      Http.createServer(this.app).listen(this.app.get("port"), function(){
        console.log(self.configuration.appName + " server started");
      });
    }
  };
  module.exports = ExpressServer;
})();
