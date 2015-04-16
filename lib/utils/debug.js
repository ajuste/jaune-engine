/**
 * @file Source code for Debug util.
 * @author Alvaro Juste
 */

(function() {
	"use strict";
	var
	util = require('util');

	exports.create = function() {
		return new Debug();
	};
	/**
	 * @constructor Constructs an instance of the class.
	 * @name {jaune.common.Debug}
	 */
	function Debug() {}

	Debug.prototype = {
		/**
		 * Writes object into debug.
		 * @function
		 * @param {Object} obj Object to be written.
		 * @returns
		 */
		writeObject : function(obj) {
			return util.inspect(obj, {
				showHidden: true, 
				colors: true
			});
		},
		/**
		* Prints an object into log.
		* @function
		* @param {Object} obj The object.
		* @param {String} module Name of mofule printing.
		*/
		printObject : function(obj, module) {
			util.log('[DEBUG' + (module ? '/' + module : 'OBJ') + '] ' + this.writeObject(obj));
		},
		/**
		* Prints text into log.
		* @function
		* @param {String} text Text to be printed.
		* @param {String} module Name of mofule printing.
		*/
		printText : function(text, module) {
			util.log('[DEBUG' + (module ? '/' + module : '') + '] ' + text);
		}	
	};
	jaune.common.extend(jaune, {
		common : {
			Debug : Debug
		}
	}, false);
})();