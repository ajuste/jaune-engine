/**
 * @file Source code for Convert.
 * @author Alvaro Juste
 */
(function() {"use strict";
	var
	modules = {
		uuid : new jaune.common.UUID()
	};
	/**
	 * @class Convert constructor
	 * @name {jaune.common.Convert}
	 */
	function Convert() {
	}
	Convert.prototype = {
		/**
		 * Converts to UUID.
		 * 
		 * @param {*} input Input to be convert to UUID.
		 * @returns UUID.
		 */
		toUUID : function(input) {
			var
			value = null;
			
			switch(typeof input) {
			
				case "string" :
					value = input;
					break;
					
				case "object" :
					if (input) {
						if (input instanceof Buffer) {
							value = input.toString("hex");
						}
					}
					else {
						value = modules.uuid.empty();
					}
					break;
					
				case "undefined" :
					value = modules.uuid.empty();
					break;
			}
			if (value) {
				return modules.uuid.parse(value);
			}
			throw new Error("Invalid input");
		},
		/**
		 * Converts to UUID file format.
		 * 
		 * @param {*} input Input to be convert to UUID.
		 * @returns UUID.
		 */
		toUUIDPath : function(input) {
			return modules.uuid.asV4(this.toUUID(input)).toUpperCase();
		},
		/**
		 * Converts an input to required target type.
		 * @param {*} input The input.
		 * @param {String} to Name of target type.
		 * @returns Required typed value.
		 */
		convert : function(input, to) {
			switch(to) {
				case "UUID" : 
					return this.toUUID(input);
				case "UUIDPath" : 
					return this.toUUIDPath(input);
				default :
					throw new Error("Unsupported target type: " + to);
			}
		}
	};
	//begin:	global
	jaune.common.extend(jaune, {
		common : {
			Convert : Convert
		}
	}, false);
	//end:	global
})();