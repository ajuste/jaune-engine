const _extend  = require("lodash").extend;
const _exports = {};

_extend(_exports, require("./email-manager"));
_extend(_exports, require("./email-daemon"));

module.exports = _exports;
