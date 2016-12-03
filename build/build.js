require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

},{}],"tags-input":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = tagsInput;

var _escapeStringRegexp = require('escape-string-regexp');

var _escapeStringRegexp2 = _interopRequireDefault(_escapeStringRegexp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BACKSPACE = 8,
    TAB = 9,
    ENTER = 13,
    LEFT = 37,
    RIGHT = 39,
    DELETE = 46;

var COPY_PROPS = 'placeholder pattern spellcheck autocomplete autocapitalize autofocus accessKey accept lang minLength maxLength required'.split(' ');

function checkerForSeparator(separator) {
	function simple(separator) {
		return {
			split: function split(s) {
				return s.split(separator);
			},
			join: function join(arr) {
				return arr.join(separator);
			},
			test: function test(char) {
				return char === separator;
			}
		};
	}

	function multi(separators) {
		var regex = separators.split('').map(_escapeStringRegexp2.default).join('|');

		regex = new RegExp(regex);

		return {
			split: function split(s) {
				return s.split(regex);
			},
			join: function join(arr) {
				return arr.join(separators[0]);
			},
			test: function test(char) {
				return regex.test(char);
			}
		};
	}

	return separator.length > 1 ? multi(separator) : simple(separator);
}

function createElement(type, name, text, attributes) {
	var el = document.createElement(type);
	if (name) el.className = name;
	if (text) el.textContent = text;
	for (var key in attributes) {
		el.setAttribute('data-' + key, attributes[key]);
	}
	return el;
}

function insertAfter(child, el) {
	return child.nextSibling ? child.parentNode.insertBefore(el, child.nextSibling) : child.parentNode.appendChild(el);
}

function caretAtStart(el) {
	try {
		return el.selectionStart === 0 && el.selectionEnd === 0;
	} catch (e) {
		return el.value === '';
	}
}

function charFromKeyboardEvent(e) {
	if ('key' in e) {
		// most modern browsers
		return e.key;
	}
	if ('keyIdentifier' in e) {
		// Safari < 10
		return String.fromCharCode(parseInt(event.keyIdentifier.slice(2), 16));
	}
	// other old/non-conforming browsers
	return e.char;
}

var eachNode = 'forEach' in NodeList.prototype ? function (nodeList, fn) {
	return nodeList.forEach(fn);
} : function (nodeList, fn) {
	for (var i = 0; i < nodeList.length; i++) {
		fn(nodeList[i]);
	}
};

function tagsInput(input) {

	function $(selector) {
		return base.querySelector(selector);
	}

	function $$(selector) {
		return base.querySelectorAll(selector);
	}

	function getValue() {
		var value = [];
		if (base.input.value) value.push(base.input.value);
		eachNode($$('.tag'), function (t) {
			return value.push(t.textContent);
		});
		return checker.join(value);
	}

	function setValue(value) {
		eachNode($$('.tag'), function (t) {
			return base.removeChild(t);
		});
		savePartialInput(value);
	}

	function save() {
		input.value = getValue();
		// HACK: dispatchEvent can throw on FF when input is not in DOM
		try {
			input.dispatchEvent(new Event('change'));
		} catch (e) {}
	}

	function checkAllowDuplicates() {
		var allow = input.getAttribute('data-allow-duplicates') || input.getAttribute('duplicates');
		return allow === 'on' || allow === '1' || allow === 'true';
	}

	// Return false if no need to add a tag
	function addTag(text) {
		function addOneTag(text) {
			var tag = text && text.trim();
			// Ignore if text is empty
			if (!tag) return false;

			// For duplicates, briefly highlight the existing tag
			if (!allowDuplicates) {
				var _ret = function () {
					var exisingTag = $('[data-tag="' + tag + '"]');
					if (exisingTag) {
						exisingTag.classList.add('dupe');
						setTimeout(function () {
							return exisingTag.classList.remove('dupe');
						}, 100);
						return {
							v: false
						};
					}
				}();

				if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
			}

			base.insertBefore(createElement('span', 'tag', tag, { tag: tag }), base.input);
		}

		// Add multiple tags if the user pastes in data with SEPERATOR already in it
		checker.split(text).forEach(addOneTag);
	}

	function select(el) {
		var sel = $('.selected');
		if (sel) sel.classList.remove('selected');
		if (el) el.classList.add('selected');
	}

	function savePartialInput(value) {
		if (typeof value !== 'string' && !Array.isArray(value)) {
			// If the base input does not contain a value, default to the original element passed
			value = base.input.value;
		}
		if (addTag(value) !== false) {
			base.input.value = '';
			save();
		}
	}

	function refocus(e) {
		if (e.target.classList.contains('tag')) select(e.target);
		if (e.target === base.input) return select();
		base.input.focus();
		e.preventDefault();
		return false;
	}

	var base = createElement('div', 'tags-input'),
	    checker = checkerForSeparator(input.getAttribute('data-separator') || ','),
	    allowDuplicates = checkAllowDuplicates();

	insertAfter(input, base);

	input.style.cssText = 'position:absolute;left:0;top:-99px;width:1px;height:1px;opacity:0.01;';
	input.tabIndex = -1;

	var inputType = input.getAttribute('type');
	if (!inputType || inputType === 'tags') {
		inputType = 'text';
	}
	base.input = createElement('input');
	base.input.setAttribute('type', inputType);
	COPY_PROPS.forEach(function (prop) {
		if (input[prop] !== base.input[prop]) {
			base.input[prop] = input[prop];
			try {
				delete input[prop];
			} catch (e) {}
		}
	});
	base.appendChild(base.input);

	input.addEventListener('focus', function () {
		base.input.focus();
	});

	base.input.addEventListener('focus', function () {
		base.classList.add('focus');
		select();
	});

	base.input.addEventListener('blur', function () {
		base.classList.remove('focus');
		select();
		savePartialInput();
	});

	base.input.addEventListener('keydown', function (e) {
		var el = base.input,
		    key = e.keyCode || e.which,
		    separator = checker.test(charFromKeyboardEvent(e)),
		    selectedTag = $('.tag.selected'),
		    lastTag = $('.tag:last-of-type');

		if (key === ENTER || key === TAB || separator) {
			if (!el.value && !separator) return;
			savePartialInput();
		} else if (key === DELETE && selectedTag) {
			if (selectedTag !== lastTag) select(selectedTag.nextSibling);
			base.removeChild(selectedTag);
			save();
		} else if (key === BACKSPACE) {
			if (selectedTag) {
				select(selectedTag.previousSibling);
				base.removeChild(selectedTag);
				save();
			} else if (lastTag && caretAtStart(el)) {
				select(lastTag);
			} else {
				return;
			}
		} else if (key === LEFT) {
			if (selectedTag) {
				if (selectedTag.previousSibling) {
					select(selectedTag.previousSibling);
				}
			} else if (!caretAtStart(el)) {
				return;
			} else {
				select(lastTag);
			}
		} else if (key === RIGHT) {
			if (!selectedTag) return;
			select(selectedTag.nextSibling);
		} else {
			return select();
		}

		e.preventDefault();
		return false;
	});

	// Proxy "input" (live change) events , update the first tag live as the user types
	// This means that users who only want one thing don't have to enter commas
	base.input.addEventListener('input', function () {
		input.value = getValue();
		input.dispatchEvent(new Event('input'));
	});

	// One tick after pasting, parse pasted text as CSV:
	base.input.addEventListener('paste', function () {
		return setTimeout(savePartialInput, 0);
	});

	base.addEventListener('mousedown', refocus);
	base.addEventListener('touchstart', refocus);

	base.setValue = setValue;
	base.getValue = getValue;

	// Add tags for existing values
	savePartialInput(input.value);
}

// make life easier:
tagsInput.enhance = tagsInput.tagsInput = tagsInput;
module.exports = exports['default'];

},{"escape-string-regexp":1}]},{},[]);