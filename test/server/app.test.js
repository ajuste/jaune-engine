require("../base");

var _      = require("underscore");
var should = require('should');
var je     = require("../../");

describe("/server/App", function() {

  var app;

  describe("pre()", function() {

    beforeEach(function() {
      app = new je.App();
      app.pre();
    });

    afterEach(function() {
      app.unload();
      app = null;
    });

    it("should populate process env", function() {
      process.should.have.propertyByPath("env", "type").eql("production");
      process.should.have.propertyByPath("env", "path").eql(process.cwd());
    });

    it("should populate application in process", function() {
      process.should.have.propertyByPath("app").eql(app);
    });
  });

  describe("unload()", function() {

    beforeEach(function() {
      app = new je.App();
      process.env = {
        type : "test",
        path : "/home/"
      };
      process.app = {};
      app.unload();
    });

    afterEach(function() {
      app = null;
    });

    it("should unload process", function() {
      process.should.have.have.propertyByPath("env").eql(null);
      process.should.have.have.propertyByPath("app").eql(null);
    });
  });
});
