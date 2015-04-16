/**
 * @file Source code for Hashing functions.
 * @author Alvaro Juste
 */

var
crypto = require('crypto');

/**
 * 
 */
function Hashing(args) {
	this.encoding = args.encoding;
	this.hashing = crypto.createHash(args.algorithm);
}
Hashing.prototype = {

	digest : function(digest) {
		this.hashing.update(digest);
		return this.hashing.digest(this.encoding);
	},
	unload : function() {
		this.hashing = undefined;
		this.encoding = undefined;
	}
};
//begin:	global
jaune.common.extend(jaune, {
	crypto : {
		Hashing : Hashing
	}
}, false);
//end:	global