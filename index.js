"use strict";

// 3rd
const _extend      = require("lodash").extend;

// jaune
const _environment = require("jaune-env");
const _fs          = require("jaune-fs");

// lib
const _daemon      = require("./lib/daemon");
const _db          = require("./lib/db");
const _errors      = require("./lib/error");
const _logging     = require("./lib/logging");
const _mail        = require("./lib/mail");
const _crypto      = require("./lib/crypto");
const _security    = require("./lib/security");

module.exports = {
  /**
   * @function Create a new engine based on configuration.
   * @param    {Object} config The configuration
   * @returns  {Object} engine
   */
  create : function(config) {

    const _env      = new _environment(config);
    const _instance = {};

    // env namespace
    _extend(_instance, { Environment : _env });

    // crypto namespace
    _extend(_instance, { Crypto : _crypto });
    _extend(_instance, { Crypto : { Hashing : new _crypto.Hashing() }});

    // fs namespace
    _extend(_instance, { Fs : _fs });
    _extend(_instance, { Fs : { Manager : new _fs.Manager(_env) }});

    // logging namespace
    _extend(_instance, { Logging : { Manager : new _logging.Manager(_env) } });

    // error namespace
    _extend(_instance, { Error : _errors });
    _extend(_instance, { Error : { Manager : new _errors.Manager() }});

    // security namespace
    _extend(_instance, { Security : _security });
    _extend(_instance, { Security : { Manager : new _security.Manager() }});

    // daemon namespace
    _extend(_instance, { Daemon : _daemon });
    _extend(_instance, { Daemon : { Manager : new _daemon.Manager() }});

    // mail namespace
    _extend(_instance, { Mail : _mail });
    _extend(_instance, { Mail : { Manager : new _mail.Manager(_env) }});

    // db namespace
    _extend(_instance, { Db : _db });
    _extend(_instance, { Db : { Manager : new _db.Manager(_env) }});

    return _instance;
  }
};
