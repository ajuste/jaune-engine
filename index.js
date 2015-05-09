require("./lib/utils/boolean");
require("./lib/utils/array");
require("./lib/utils/date");
require("./lib/utils/time");

module.exports = {
  Reflection : require("./lib/utils/reflection").Reflection,
  UUID : require("./lib/utils/uuid").UUID,
  Stream : {
    WriteReadStream  : require("./lib/utils/streams").WriteReadStream
  },
  Convert : require("./lib/utils/convert"),
  Debug : require("./lib/utils/debug"),
  Validator : require("./lib/utils/validator"),
  Hashing : require("./lib/crypto/hashing"),
  Environment : require("./lib/server/environment"),
  Logging : {
    Manager : require("./lib/logging/logging-manager")
  },
  Error : {
    Errors : require("./lib/error/errors"),
    Manager : require("./lib/error/error-manager")
  },
  Security : require("./lib/security/security"),
  FileSystem : require("./lib/filesystem/filesystem-manager"),
  Daemon : {
    Status : require("./lib/daemon/daemon-def").DaemonStatus,
    Manager : require("./lib/daemon/daemon-manager").DaemonManager,
    Daemon : require("./lib/daemon/daemon").Daemon
  },
  Http : {
    Util : require("./lib/http/http-util")
  },
  Mail : {
    MailManager : require("./lib/mail/email-manager").MailManager
  },
  Db : {
    SqlQueryExecutor : require("./lib/db/db-sql-query-executor").SqlQueryExecutor,
    Manager : require("./lib/db/db-manager").DatabaseManager,
    SqlUtil : require("./lib/db/db-sql-util").SqlUtil
  },
  Locale : {
    Locale : require("./lib/localization/locale").LocaleManager
  },
  App : require("./lib/server/app")
};
