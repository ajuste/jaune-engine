(function() {
	
	"use strict";
	
	var
	modules = {
		util : require('util'),
		stream : require('stream')
	};
	/**
	 * @class Write read stream.
	 * @name {jaune.stream.WriteReadStream}
	 */
	function WriteReadStream() {
		
		modules.stream.call(this);
		this.readable = true;
		this.writable = true;
		/**
		 * Write into stream
		 * @function
		 */
		this.write = function () {
			this.emit.apply(this, ['data'].concat(Array.prototype.slice.call(arguments, 0)));
		};
		/**
		 * Mark as end.
		 * @function
		 */
		this.end = function () {
			this.emit.apply(this, ['end'].concat(Array.prototype.slice.call(arguments, 0)));
		};
	}
	
	modules.util.inherits(WriteReadStream, modules.stream);
	
	//begin:	global
	jaune.common.extend(jaune, {
		stream : {
			WriteReadStream : WriteReadStream
		}
	}, false);
	//end:	global
})();