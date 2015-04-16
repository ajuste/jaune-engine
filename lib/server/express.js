var
modules = {
	express : require('express'),
	http : require('http'),
	path : require('path'),
	i18n : require("i18next"),
	env : new jaune.env.Environment(),
	reflection : new jaune.reflection.Reflection(),
	httpUtil : new jaune.http.Util(),
	loggingManager : new jaune.logging.LoggingManager(),
	localeManager : new jaune.app.locale.LocaleManager()
},
settings = {
	session : modules.env.getModulesSettings().http.session,
	request : modules.env.getModulesSettings().http.request,
	locale : modules.env.getLocale(),
	fileSystem : modules.env.getModulesSettings().fileSystem,
	csrf : false
},
logger = {
	core : modules.loggingManager.instance("core")
};
var
ModuleName = "server/express";
/**
 * Express constructor
 * @class Represents the server. Handles initialization and finalize.
 * @param {Object} configuration Configuration
 * @returns Instance of class
 */
function Express(configuration) {
	this.configuration = configuration;
	this.app = modules.express();
}
/**
 * Express prototype
 */
Express.prototype = {
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
		this.app.use(modules.i18n.handle);
		
		if ("development" === process.env.type) {
			this.app.use(modules.express.logger("dev"));
			//this.app.use(modules.express.errorHandler());
		}
		if ("string" === typeof this.configuration.web.favicon) {
			this.app.use(modules.express.favicon(this.configuration.web.favicon));
		}
		if (true === this.configuration.web.json) {
			this.app.use(modules.express.json());
		}
		if (true === this.configuration.web.urlencoded) {
			this.app.use(modules.express.urlencoded());
		}
		if (true === this.configuration.web.methodOverride) {
			this.app.use(modules.express.methodOverride());
		}
		if (true === this.configuration.web.cookieParser) {
			this.app.use(modules.express.cookieParser());
		}
		if (true === this.configuration.web.session) {

			var sessionConfig = this.configuration.web.sessionConfig;

			this.app.use(modules.express.session({
				secret : sessionConfig.secret,
				key : sessionConfig.key,
				cookie : sessionConfig.cookie,
				store : modules.reflection.createInstance(sessionConfig.store.constructor, sessionConfig.store.arguments, sessionConfig.store.context)
			}));
		//	this.app.use(modules.express.csrf());
		//	settings.csrf = true;
		}
		this.app.use(function(req, res, next) {
			
			function cb() {
				if (modules.httpUtil.getHeaderContentType(req).indexOf("multipart/form-data") === 0) {
					modules.httpUtil.processMultipart(req, multipart);
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
			if (settings.csrf && req.csrfToken) {
				res.cookie("x-csrf-token", req.csrfToken());
			}
			if (req.session) {
				modules.httpUtil.setupRequest({ request : req, response : res, localeManager : modules.localeManager, logger : logger.core, loggerArgs : { module : ModuleName, operation : 'onRequest' }}, cb);
			}
			else {
				cb();
			}
		});
		this.app.use(this.app.router);
		this.app.disable("x-powered-by"); // for security reasons.
		
		if (true === this.configuration.static) {
			this.app.use(modules.express.static(this.configuration.staticConfig.path, { maxAge : settings.fileSystem.maxAge }));
		}

		//	default route
		if ("function" === typeof this.configuration.web.routes.defaultRouter) {
			this.app.use(this.configuration.web.routes.defaultRouter);
		}
		//	error handling
		if ("function" === typeof this.configuration.error.handler) {
			this.app.use(this.configuration.error.handler);
		}
		
		//	i18n
		modules.i18n.init({ useCookie : true, fallbackLng: settings.locale.defaultLanguage, debug : settings.locale.debug, cookieName : "lng", detectLngQS : "lng" });
		modules.i18n.registerAppHelper(this.app);
	},
	/**
	 * Initialize the server.
	 * 
	 * @function
	 */
	init : function() {
		
		var
		self = this;

		this.setupModules();
		this.configuration.init.setupRoutes(this.app);
		this.configuration.init.initDeamons();
		
		//	initialize server
		modules.http.createServer(this.app).listen(this.app.get("port"), function(){
			console.log(self.configuration.appName + ' server started');
		});
	}
};
jaune.common.extend(jaune, {
	server : {
		Express : Express
	}
}, false);