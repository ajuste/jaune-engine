/**
 * @file Source code for UUID.
 * @author Alvaro Juste
 */

var
uuid = require('node-uuid');

/**
 * Represents an UUID.
 * 
 * @returns
 */
function UUID() {
	
}
UUID.prototype = {
	/**
	 * 
	 */
	create : function(buffer) {
		return uuid.v4({}, buffer || new Buffer(16));
	},
	plain : function() {
		return this.asPlain(this.create());
	},
	asPlain : function(uuid, encoding) {
		return uuid.toString(encoding || 'hex').replace(/-/g, '');
	},
	asV4 : function(val) {
		var
		value = val || this.create();
		
		return uuid.unparse("string" === typeof val ? this.parse(val) : val);
	},
	parse : function(input, buffer) {
		return uuid.parse(input, buffer || new Buffer(16));
	},
	equal : function(uuid1, uuid2) {
		return uuid1.toString().toLowerCase() === uuid2.toString().toLowerCase();
	},
	empty : function() {
		return '00000000-0000-0000-0000-000000000000';
	}
};
//	begin:	global
jaune.common.extend(jaune, {
	common : {
		UUID : UUID
	}
}, false);
//	end:	global