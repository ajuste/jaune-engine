var _           = require("underscore");
var Environment = require("./environment");

_.extend(process, {
  app : {
    configuration : {
      environment : Environment.Environment
    }
  }
});
