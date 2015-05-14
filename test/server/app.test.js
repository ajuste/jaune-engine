require("../base");

var _          = require("underscore");
var should     = require("should");
var sinon      = require("sinon");
var App        = require("../../lib/server/app");

describe("/server/App", function() {

  var express = function(configuration) {
    this.configuration = configuration;
    this.init = function() {
      return {};
    };
  };

  describe("pre()", _.bind(function() {

    beforeEach(_.bind(function() {
      this.app = new App();
      this.app.pre();
    }, this));

    afterEach(_.bind(function() {
      this.app.unload();
      this.app = null;
    }, this));

    it("should populate process env", _.bind(function() {
      process.should.have.propertyByPath("env", "type").eql("production");
      process.should.have.propertyByPath("env", "path").eql(process.cwd());
    }, this));

    it("should populate this.application in process", _.bind(function() {
      process.should.have.propertyByPath("app").eql(this.app);
    }, this));
  }, this));

  describe("unload()", _.bind(function() {

    beforeEach(_.bind(function() {
      this.app = new App();
      process.env = {
        type : "test",
        path : "/home/"
      };
      process.app = {};
      this.app.unload();
    }, this));

    afterEach(_.bind(function() {
      this.app = null;
    }, this));

    it("should unload process", _.bind(function() {
      process.should.have.have.propertyByPath("env").eql(null);
      process.should.have.have.propertyByPath("app").eql(null);
    }, this));
  }, this));

  describe("startServer()", _.bind(function() {

    beforeEach(_.bind(function() {
      process.testing.mocking["/lib/server/express"].prototype.init = sinon.stub().returns();
      this.app = new App();
      process.env = {
        type : "test",
        path : "/home/"
      };
      process.app = {};
    }, this));

    afterEach(_.bind(function() {
      this.app.unload();
      this.app = null;
    }, this));

    it("should create new instance of server", _.bind(function() {
      this.app.startServer();
      this.app.server.init.calledOnce.should.be.eql(true);
    }, this));
  }, this));

  describe("init()", _.bind(function() {

    before(_.bind(function() {
      this.app = new App();
      this.app.pre = sinon.stub().returns();
      this.app.parseArguments = sinon.stub().returns();
      this.app.startServer = sinon.stub().returns();
      process.env = {
        type : "test",
        path : "/home/"
      };
      process.app = {};
    }, this));

    after(_.bind(function() {
      this.app.unload();
      this.app = null;
    }, this));

    it("should initialize correctly", _.bind(function() {
      this.app.init({
        init : {
          loadStatic : sinon.stub().returns()
        }
      });
      this.app.pre.calledOnce.should.be.eql(true);
      this.app.parseArguments.calledOnce.should.be.eql(true);
      this.app.configuration.init.loadStatic.calledOnce.should.be.eql(true);
      this.app.startServer.calledOnce.should.be.eql(true);
    }, this));
  }, this));
});
