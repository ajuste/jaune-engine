var path = require('path');

var values = {
  environment : {
    directories : {
      temp : './tmp'
    }
  },
  logging : {
    core : {
      type : 'db',
      module : 'iindchance.app.logging.DatabaseLogging'
    }
  },
  mail : {
    core : {
      type : 'jaune.mail.SendGridMailer',
      accounts : {
        admin : {
          account : '',
          name : '',
          password : '',
          user : ''
        }
      }
    }
  },
  fileSystem : {
    connections : {
      coreStatic : {
        type : 'jaune.fs.FsClient'
      },
      coreDynamic : {
        type : 'jaune.fs.FsClient'
      }
    }
  },
  db : {
    connections : {
      user : {
        type : 'jaune.db.sql.MongooseDbClient',
        url : "",
        opts : { server: { poolSize: 5 }}
      },
      core : {
        type : 'jaune.db.sql.PostgresClient',
        server : {
          user : 'cuac',
          password : '',
          host : '',
          port : '',
          database : '',
          ssl : true
        }
      }
    }
  },
  folders : {
    'app-root' : '',
    services : 'svc',
    sources : 'src',
    resources : 'root',
    dynamicDataRoot : '',
    'public-resources' : 'public-resources',
    'user-public-data' : 'user-public-data'
  },
  debug : {
    filesystem : {
      copy : false
    },
    mail : {
      outgoing : false
    },
    sql : {
      queries : false,
      internal : false,
      links : false
    },
    http : {
      session : {
        init : false,
        unload : false,
        get : false
      }
    },
    module : {
      section : {
        get : false
      }
    }
  },
  modules : {
    fileSystem : {
      staticMaxAge : 86400000
    },
    mail : {
      listSendeablesPageSize : 10,
      daemon : {
        loop : 35000,
        sendTimeout : 30000,
        processSpan : 45000, // this value needs to be 50% bigger than sendTimeout
      }
    },
    user : {
      password : {
        hashAlgorithm : 'sha1',
        strategy : 'email+password',
        hashEncoding : 'hex'
      },
      keepMeLoggedIn : {
        duration : 864000000
      // 10 days
      },
      instance : null
    },
    http : {
      session : {
        secret : '1',
        store : '[r(express)].session.MemoryStore',
        storeArgs : '[]',
        key : 'SID', // override default name for security reasons
        // TODO: SEC - Add secure: true when https enabled.
        timeout : 300000,
        cookie : {
          httpOnly : true,
          maxAge : 300000
        }
      },
      cache : {
        enabled : true
      },
      compression : {
        enabled : true
      },
      request : {
        maxSize : "500kb"
      }
    },
    userLoginDevice : {
      maxDevicesPerUser : 10
    }
  },
  host : {
    protocol : 'http',
    host : 'localhost',
    port : 80
  },
  locale : {
    debug : false,
    defaultLanguage : "en",
    defaultCountry : "US",
    supportedCountries : [
        "US", "UY", "CL"
    ],
    supportedLanguages : [
        "en", "es"
    ]
  }
};

var Environment = function() {

};

Environment.prototype = {

  getHost : function() {
    return values.host;
  },

  getLocale : function() {
    return values.locale;
  },

  getPages : function() {
    return values.pages;
  },

  getModulesSettings : function() {
    return values.modules || {};
  },

  getDebugSettings : function() {
    return values.debug || {};
  },

  getPathToAppRoot : function() {
    return values.folders['app-root'];
  },

  setPathToAppRoot : function(value) {
    values.folders['app-root'] = value;
  },

  getPathToServices : function() {
    return path.join(this.getPathToAppRoot(), values.folders.sources, values.folders.services);
  },

  getModuleFileExtension : function() {
    return values.loader.modules.fileExtension;
  },

  getFileSystemConnection : function(key) {
    return values.fileSystem.connections[process.env.type === 'development' ? key + 'Develop' : key];
  },

  getDatabaseConnection : function(key) {
    return values.db.connections[process.env.type === 'development' ? key + 'Develop' : key];
  },

  getMail : function(key) {
    return values.mail[process.env.type === 'development' ? key + 'Develop' : key];
  },

  getLogging : function(key) {
    return values.logging[key];
  },

  getFolders : function() {
    return values.folders;
  },

  setUserServiceInstance : function(instance) {
    values.modules.user.instance = instance;
  },

  getUserServiceInstance : function() {
    return values.modules.user.instance;
  },

  getEnvironment : function() {
    return process.env.type;
  }
};
exports.Environment = Environment;
