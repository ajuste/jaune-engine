/**
 * @file Source code for common functions.
 * @author Alvaro Juste
 */

jaune.common = {
	extend : function(target, properties, override) {
			
		if (typeof override !== 'boolean') {
			override = true;
		}
		for (var property in properties) {
			if (override || !target[property]) {
				target[property] = properties[property];
			}
			else {
				jaune.common.extend(target[property], properties[property], override);
			}
		}
		return target;
	},
	
	bind : function(fn, context) {
		return function() {
			return fn.apply(context, arguments);
		};
	},
	bindAsArgument : function(fn, context) {
		return function() {
			return fn.apply(undefined, jaune.common.addNewArgument(context, arguments));
		};
	},
	/**
	 * Adds a new argument to arguments object at the beginning
	 * @param {*} val The new value of the argument.
	 * @param {Object} args Arguments object.
	 * @returns {Object} The modified arguments object.
	 */
	addNewArgument : function(val, args) {
		for(var i = args.length; i >= 0; i--) {
			args[(i + 1).toString()] = args[i];
		}
		args["0"] = val;
		return args;
	},
	types : {
		isReferenceType : function(type) {
			return "object" === type || "function" === type;
		}
	},
	object : {
		asDictionary : function(obj, includeNotOwn) {
			var
			result = [];
			
			for(var name in obj) {
				if ((includeNotOwn === true || obj.hasOwnProperty(name)) && !jaune.common.types.isReferenceType(typeof(obj[name]))) {
					result.push({
						id : name,
						name : obj[name]
					});
				}
			}
			return result;
		}
	},
	wrapCallback : function(cb) {
		
	}
};