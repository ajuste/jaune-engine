/**
 * @file Source code for Reflection utility.
 * @author Alvaro Juste
 */
(function() {
	"use strict";
	/**
	 * @class Builds an instance of the Reflection class.
	 * @name {jaune.common.reflection.Reflection}
	 */
	function Reflection() {}

	Reflection.prototype = (function() {
		/**
		 *	Create an instance of the given constructor with the given arguments.
		 * 
		 * @param {Function} constructor The constructing function.
		 * @param {Array} args Arguments for the constructor
		 * @returns The instance.
		 */
		function applyNew(constructor, args) {
			
			var
			inst = Object.create(constructor.prototype);
			
			constructor.apply(inst, args);
			
			return inst;
		}
		
		var regExp = {
			requireToken : /^\[r\((.*)\)\]$/
		};
		
		return {
			
			createInstance : function(fullName, args, context) {
				
				var
				constructor = this.evaluateName(fullName, context);
				
				if (typeof constructor !== 'function') {
					throw new Error('Full name points to invalid constructor');
				}
				return applyNew(constructor, args);
			},
			evaluateName : function(fullName, context) {
				
				if (typeof fullName !== 'string') {
					throw new Error('Full name is not valid');
				}
				
				var
				segments = fullName.split('.'),
				segment = null,
				root = context || global;
				
				for(var index = 0; index < segments.length; index++) {
					
					segment = (segment ? segment : root);
					
					if (regExp.requireToken.test(segments[index])) {
						segment = require(segments[index].replace(regExp.requireToken, "$1"));
					}
					else {
						segment = segment[segments[index]];
					}
					
					if (typeof segment === 'undefined') {
						throw new Error('Full name points to invalid reference');
					}
				}
				return segment;
			}
		};
	})();
	//	begin:	global
	jaune.common.extend(jaune, {
		reflection : {
			Reflection : Reflection
		}
	}, false);
	//	end:	global
})();