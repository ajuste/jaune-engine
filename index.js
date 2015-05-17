global._require = function(){
  return function(name) {
    return require(name.indexOf("/") !== -1 ? [__dirname, name].join("/") : name);
  };
};

require("./lib/utils/boolean");
require("./lib/utils/array");
require("./lib/utils/date");
require("./lib/utils/time");

var Environment = null;
var Instance    = null;

module.exports = {
  init : function(config) {

    Environment = require("./lib/server/environment").init(config);
    Instance = {};
    Instance.Environment = Environment;
    Instance.Reflection = require("./lib/utils/reflection").Reflection;
    Instance.UUID = require("./lib/utils/uuid").UUID;
    Instance.Stream = {};
    Instance.Stream.WriteReadStream = require("./lib/utils/streams").WriteReadStream;
    Instance.Convert = require("./lib/utils/convert");
    Instance.Debug = require("./lib/utils/debug");
    Instance.Validator = require("./lib/utils/validator").Validator;
    Instance.Crypto = {};
    Instance.Crypto.Hashing = require("./lib/crypto/hashing").Hashing;
    Instance.Logging = {};
    Instance.Logging.Manager = require("./lib/logging/logging-manager").LoggingManager;
    Instance.Error = {};
    Instance.Error.Errors = require("./lib/error/errors");
    Instance.Error.Manager = require("./lib/error/error-manager").Manager;
    Instance.Security = require("./lib/security/security");
    Instance.FileSystem = require("./lib/filesystem/filesystem-manager");
    Instance.Daemon = {};
    Instance.Daemon.Status = require("./lib/daemon/daemon-def").DaemonStatus;
    Instance.Daemon.Manager = require("./lib/daemon/daemon-manager").DaemonManager;
    Instance.Daemon.Daemon = require("./lib/daemon/daemon").Daemon;
    Instance.Http = {};
    Instance.Http.Util = require("./lib/http/http-util").Util;
    Instance.Http.HttpCode = require("./lib/http/http-util").HttpCode;
    Instance.Mail = {};
    Instance.Mail.Manager = require("./lib/mail/email-manager").MailManager;
    Instance.Db = {};
    Instance.Db.SqlQueryExecutor = require("./lib/db/db-sql-query-executor").SqlQueryExecutor;
    Instance.Db.Manager = require("./lib/db/db-manager").DatabaseManager;
    Instance.Db.SqlUtil = require("./lib/db/db-sql-util").SqlUtil;
    Instance.Locale = {};
    Instance.Locale.Manager = require("./lib/localization/locale").LocaleManager;
    Instance.App = require("./lib/server/app");

    return Instance;
  },
  get : function() {
    return Instance;
  }
};
