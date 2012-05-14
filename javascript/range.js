/**
 * Helper module to work with ranges
 * @constructor
 * @memberOf __rangeDefine
 * @param {Function} require
 * @param {Underscore} _
 */
zen_coding.define('range', function(require, _) {
	/**
	 * @type Range
	 * @constructor
	 * @param {Number} start
	 * @param {Number} len
	 */
	function Range(start, len) {
		len = _.isString(len) ? len.length : +len;
		this.start = start;
		this.end = start + len;
	}
	
	Range.prototype = {
		length: function() {
			return Math.abs(this.end - this.start);
		},
		
		/**
		 * Returns <code>true</code> if passed range is equals to current one
		 * @param {Range} range
		 * @returns {Boolean}
		 */
		equal: function(range) {
			return this.start === range.start && this.end === range.end;
		},
		
		/**
		 * Shifts indexes position with passed <code>delat</code>
		 * @param {Number} delta
		 */
		shift: function(delta) {
			this.start += delta;
			this.end += delta;
		},
		
		/**
		 * Check if two ranges are overlapped
		 * @param {Range} range
		 * @returns {Boolean}
		 */
		overlap: function(range) {
			return range.start <= this.end && range.end >= this.start;
		},
		
		/**
		 * Finds intersection of two ranges
		 * @param {Range} range
		 * @returns {Range} <code>null</code> if ranges does not overlap
		 */
		intersection: function(range) {
			if (this.overlap(range)) {
				var start = Math.max(range.start, this.start);
				var end = Math.min(range.end, this.end);
				return new Range(start, end - start);
			}
			
			return null;
		},
		
		/**
		 * Returns the union of the thow ranges.
		 * @param {Range} range
		 * @returns {Range} <code>null</code> if ranges are not overlapped
		 */
		union: function(range) {
			if (this.overlap(range)) {
				var start = Math.min(range.start, this.start);
				var end = Math.max(range.end, this.end);
				return new Range(start, end - start);
			}
			
			return null;
		},
		
		/**
		 * Returns a Boolean value that indicates whether a specified position 
		 * is in a given range.
		 * @param {Number} loc
		 */
		inside: function(loc) {
			return this.start <= loc && this.end > loc;
		},
		
		/**
		 * @returns {Array}
		 */
		toArray: function() {
			return [this.start, this.end];
		},
		
		/**
		 * Returns substring of specified <code>str</code> for current range
		 * @param {String} str
		 * @returns {String}
		 */
		substring: function(str) {
			return str.substring(this.start, this.end);
		}
	};
	
	return {
		/**
		 * Creates new range object instance
		 * @param {Number} start Range start
		 * @param {Number} len Range length or string to produce range from
		 * @returns {Range}
		 * @memberOf zen_coding.range
		 */
		create: function(start, len) {
			return new Range(start, len);
		}
	};
});