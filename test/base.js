global._require = function() {
  return !process.testing ?  require: function(ns) {
    return process.testing.mocking[ns];
  };
};

var _           = require("underscore");
var Environment = require("./environment");
var proxyquire  = require("proxyquire");

_.extend(process, {
  testing : {
    mocking : {}
  },
  app : {
    configuration : {
      environment : Environment.Environment
    }
  }
});
_.extend(global, {
  Logging : {
    StubLogging : function() {}
  }
});

process.testing.mocking["/lib/server/express"] = function() {};
process.testing.mocking["/lib/logging/logging-manager"] = function() {};
