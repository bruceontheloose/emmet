/**
 * Filter for producing Jade code from abbreviation.
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var _ = require('lodash');
	var utils = require('../utils/common');
	var abbrUtils = require('../utils/abbreviation');
	var formatFilter = require('./format');
	var tabStops = require('../assets/tabStops');
	var prefs = require('../assets/preferences');
	var profile = require('../assets/profile');

	var reNl = /[\n\r]/;
	var reIndentedText = /^\s*\|/;
	var reSpace = /^\s/;

	prefs.define('slim.attributesWrapper', 'none', 
		'Defines how attributes will be wrapped:' +
		'<ul>' +
		'<li><code>none</code> – no wrapping;</li>' +
		'<li><code>round</code> — wrap attributes with round braces;</li>' +
		'<li><code>square</code> — wrap attributes with round braces;</li>' +
		'<li><code>curly</code> — wrap attributes with curly braces.</li>' +
		'</ul>');

	function transformClassName(className) {
		return utils.trim(className).replace(/\s+/g, '.');
	}

	function getAttrWrapper() {
		var start = ' ', end = '';
		switch (prefs.get('slim.attributesWrapper')) {
			case 'round':
				start = '(';
				end = ')';
				break;
			case 'square':
				start = '[';
				end = ']';
				break;
			case 'curly':
				start = '{';
				end = '}';
				break;
		}

		return {
			start: start,
			end: end
		};
	}

	function stringifyAttrs(attrs, profile) {
		var attrQuote = profile.attributeQuote();
		var attrWrap = getAttrWrapper();
		return attrWrap.start + _.map(attrs, function(attr) {
			var value = attrQuote + attr.value + attrQuote;
			if (attr.isBoolean) {
				if (!attrWrap.end) {
					value = 'true';
				} else {
					return attr.name;
				}
			}

			return attr.name + '=' + value;
		}).join(' ') + attrWrap.end;
	}
	
	/**
	 * Creates HAML attributes string from tag according to profile settings
	 * @param {AbbreviationNode} tag
	 * @param {Object} profile
	 */
	function makeAttributesString(tag, profile) {
		var attrs = '';
		var otherAttrs = [];
		var attrQuote = profile.attributeQuote();
		var cursor = profile.cursor();
		
		_.each(tag.attributeList(), function(a) {
			var attrName = profile.attributeName(a.name);
			switch (attrName.toLowerCase()) {
				// use short notation for ID and CLASS attributes
				case 'id':
					attrs += '#' + (a.value || cursor);
					break;
				case 'class':
					attrs += '.' + transformClassName(a.value || cursor);
					break;
				// process other attributes
				default:
					otherAttrs.push({
						name: attrName,
						value: a.value || cursor,
						isBoolean: profile.isBoolean(a.name, a.value)
					});
			}
		});
		
		if (otherAttrs.length) {
			attrs += stringifyAttrs(otherAttrs, profile);
		}
		
		return attrs;
	}

	function processTagContent(item) {
		if (!item.content) {
			return;
		}

		var content = tabStops.replaceVariables(item.content, function(str, name) {
			if (name === 'nl' || name === 'newline') {
				return '\n';
			}
			return str;
		});

		if (reNl.test(content) && !reIndentedText.test(content)) {
			// multiline content: pad it with indentation and pipe
			var pad = '  ';
			item.content = '\n| ' + utils.padString(content, pad);
		} else if (!reSpace.test(content)) {
			item.content = ' ' + content;
		}
	}
	
	/**
	 * Processes element with <code>tag</code> type
	 * @param {AbbreviationNode} item
	 * @param {OutputProfile} profile
	 */
	function processTag(item, profile) {
		if (!item.parent)
			// looks like it's a root (empty) element
			return item;
		
		var attrs = makeAttributesString(item, profile);
		var cursor = profile.cursor();
		var isUnary = abbrUtils.isUnary(item);
		var selfClosing = profile.self_closing_tag && isUnary ? '/' : '';
			
		// define tag name
		var tagName = profile.tagName(item.name());
		if (tagName.toLowerCase() == 'div' && attrs && '([{'.indexOf(attrs.charAt(0)) == -1)
			// omit div tag
			tagName = '';
			
		item.end = '';
		var start = tagName + attrs + selfClosing;
		processTagContent(item);

		var placeholder = '%s';
		// We can't just replace placeholder with new value because
		// JavaScript will treat double $ character as a single one, assuming
		// we're using RegExp literal.
		item.start = utils.replaceSubstring(item.start, start, item.start.indexOf(placeholder), placeholder);
		
		if (!item.children.length && !isUnary)
			item.start += cursor;
		
		return item;
	}

	return function process(tree, curProfile, level) {
		level = level || 0;
		
		if (!level) {
			// always format with `xml` profile since
			// Slim requires all tags to be on separate lines
			tree = formatFilter(tree, profile.get('xml'));
		}
		
		_.each(tree.children, function(item) {
			if (!abbrUtils.isSnippet(item)) {
				processTag(item, curProfile, level);
			}
			
			process(item, curProfile, level + 1);
		});
		
		return tree;
	};
});