"use strict";

const Events = require('events');

//const each = require("bloody-collections/lib/each");
function each(list, callback)
{
	for (var i = 0; i < list.length; i++) {
		callback(list[i]);
	}
}

var i = 0;
var defaultInstance;

const JSPON = function(config)
{

	if (!(this instanceof JSPON))
	{
		return JSPON.defaultInstance(config);
	}

	var _me = this;
	
	this.idFieldName = 'b5b813f0-9f2c-4fd5-893e-c1bc36f2aa48';
	this.useIdBase = false;
	this.preserveArrays = true;
	this.jsonParser = JSON.parse;
	this.jsonStringifier = JSON.stringify;
	this.jsonPathRoot = '$';
	this.useJSONPathDotNotation = true;
	this.i = ++i;

	this.setSettings(config);
}

JSPON.defaultInstance = function(config = {})
{
	if (!(defaultInstance instanceof JSPON))
	{
		defaultInstance = new JSPON(config);
	}

	return defaultInstance;
}

JSPON.setSettings = function(newSettings)
{
	JSPON.defaultInstance().setSettings(newSettings);
}

JSPON.prototype.setSettings = function(newSettings) {
	if (!newSettings) {
		newSettings = {};
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'preserveArrays')) {
		this.preserveArrays = newSettings.preserveArrays;
	} else {
		this.preserveArrays = true;
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'jsonPathRoot')) {
		this.jsonPathRoot = newSettings.jsonPathRoot;
		this.useIdBase = false;
		this.idFieldName = undefined;
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'jsonPathFormat')) {
		if (newSettings['jsonPathFormat'] === 'BracketNotation') {
			this.useJSONPathDotNotation = false;
		} else {
			this.useJSONPathDotNotation = true;
		}
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'idFieldName')) {
		this.idFieldName = newSettings.idFieldName;
		this.useIdBase = true;
		this.jsonPathRoot = undefined;
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'jsonParser')) {
		this.jsonParser = newSettings.parse;
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'jsonStringifier')) {
		this.jsonStringifier = newSettings.stringify
	}

	var self = this;

	const requireEvents = function()
	{
		if (!self.events)
		{
			self.events = new Events.EventEmitter();
		}
		
		return self.events;
	}

	each([
		  'onBeforeWalk'
		, 'onBeforeRef'
		, 'onBeforeWalkArray'
		, 'onBeforeWalkArrayElement'
		, 'onAfterWalkArrayElement'
		, 'onAfterWalkArray'
		, 'onBeforeWalkObject'
		, 'onBeforeWalkObjectElement'
		, 'onAfterWalkObjectElement'
		, 'onAfterWalkObject'
		, 'onAfterWalk'
	],
	function(eventName)
	{
		if (Object.prototype.hasOwnProperty.call(newSettings, eventName))
		{
			const events = requireEvents();
			
			if (newSettings[eventName].constructor === Array)
			{
				each(newSettings[eventName], function(callback){self.events.on(eventName, callback)});
			}
			else
			{
				self.events.on(eventName, newSettings[eventName]);
			}
		}
	})

	if (Object.prototype.hasOwnProperty.call(newSettings, 'refReplacementsOneToOne'))
	{
		var hasNew = false;
		var rx;
		var pattern = "";

		const events = requireEvents();

		const replacements = this.refReplacementsOneToOne ? this.refReplacementsOneToOne : {};

		const refReplacementsOneToOneCallback = function(e)
		{
			const x = e.params.obj['$ref'].replace(rx, function (needle) {return replacements[needle];});

			if (x != e.params.obj['$ref'])
			{
				//console.log("replace $ref "+e.params.obj['$ref']+" => "+x);

				e.params.obj['$ref'] = x;
			}
		}

		const regExpEscape = function(s)
		{
			return String(s)
				.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1')
				.replace(/\x08/g, '\\x08')
				;
		};

		for (var key in newSettings.refReplacementsOneToOne)
		{
			replacements[key] = newSettings.refReplacementsOneToOne[key];
			hasNew = true;
		}

		if (hasNew)
		{
			for (var key in replacements)
			{
				//console.log({pattern: pattern, key: key});
				pattern = pattern + (pattern ? "|" : "") + key;
			}

			if (pattern)
			{
				pattern = "("+regExpEscape(pattern)+")";

				rx = new RegExp(pattern, "g");

				if (!this.refReplacementsOneToOne)
				{
					this.refReplacementsOneToOne = replacements;
					
					self.events.addListener('onBeforeRef_', refReplacementsOneToOneCallback);
				}
			}
			else
			{
				self.events.removeListener('onBeforeRef_', refReplacementsOneToOneCallback);

				this.refReplacementsOneToOne = undefined;
			}
		}
	}
}

JSPON.setSettings = function(newSettings)
{
	return JSPON.defaultInstance().getSettings();
}

JSPON.prototype.getSettings = function() {
	return {
		'idFieldName': this.idFieldName,
		'useIdBase': this.useIdBase,
		'preserveArrays': this.preserveArrays,
		'jsonParser': this.jsonParser,
		'jsonStringifier': this.jsonStringifier,
		'jsonPathRoot': this.jsonPathRoot,
		'jsonPathFormat': this.useJSONPathDotNotation ? 'DotNotation' : 'BracketNotation'
	};
}

JSPON.isMapSupported = true;
try {
	Map;
}
catch (e) {
	JSPON.isMapSupported = false;
	console.log("Map is not supported.");
}

JSPON.jsponClone = function(objTracker, oldValue, id)
{
	return JSPON.defaultInstance().jsponClone(objTracker, oldValue, id);
}

JSPON.prototype.jsponClone = function(objTracker, oldValue, id)
{
	if (typeof oldValue === 'object' && oldValue !== null &&
			!(oldValue instanceof Boolean) &&
			!(oldValue instanceof Date) &&
			!(oldValue instanceof Number) &&
			!(oldValue instanceof RegExp) &&
			!(oldValue instanceof String)) {
		if (this.isMapSupported) {
			if (objTracker.has(oldValue)) {
				return { '$ref': objTracker.get(oldValue) };
			}
		} else {
			if (Object.prototype.hasOwnProperty.call(oldValue, this.idFieldName)) {
				return { '$ref': oldValue[this.idFieldName] };
			}
		}
		var newValue = oldValue.constructor();
		var isArray = oldValue.constructor === Array;
		if (isArray) {
			var arraySectionObj = newValue;
		}
		if (this.useIdBase) {
			if (this.preserveArrays && isArray) {
				newValue = { '$values': newValue };
			}
			if (!(this.preserveArrays === false && isArray)) {
				id.uniqueId++;
				if (this.isMapSupported) {
					objTracker.set(oldValue, id.uniqueId);
					newValue[this.idFieldName] = id.uniqueId;
				} else {
					oldValue[this.idFieldName] = id.uniqueId;
					objTracker[id.uniqueId] = oldValue;
					newValue[this.idFieldName] = id.uniqueId;
				}
			}
		} else {
			if (!(this.preserveArrays === false && isArray)) {
				if (this.isMapSupported) {
					objTracker.set(oldValue, id);
				} else {
					oldValue[this.idFieldName] = id;
					objTracker[id] = oldValue;
					objTracker['new' + id] = newValue;
				}
			}
		}

		if (isArray) {
			for (var i = 0; i < oldValue.length; i++) {
				arraySectionObj.push(this.jsponClone(objTracker, oldValue[i], this.useIdBase ? id : id + '[' + i + ']'));
			}
		} else {
			for (var key in oldValue) {
				if (Object.prototype.hasOwnProperty.call(oldValue, key)) {
					newValue[key] = this.jsponClone(objTracker, oldValue[key], this.useIdBase ? id : this.useJSONPathDotNotation ? id + '.' + key : id + '[\'' + key + '\']');
				}
			}
		}
		return newValue;
	}
	return oldValue;
}


JSPON.prototype.eventData = function(params)
{
	return {
		params: params || {},
		skip:   false,
		end:    false
	}
}

JSPON.jsponParse = function(objTracker, obj, id)
{
	return JSPON.defaultInstance().jsponParse(objTracker, obj, id);
}

JSPON.prototype.jsponParse = function(objTracker, obj, id)
{
	var e = this.eventData({objTracker: objTracker, obj: obj, id: id});
	
	//console.log('onBeforeWalk', e);
	if (!this.events || !this.events.emit('onBeforeWalk', e) || !e.skip)
	{
		//console.log("in onBeforeWalk loop");
		if (e.end) return e.params.obj;
		
		if (e.params.obj && typeof e.params.obj === 'object')
		{
			if (Object.prototype.hasOwnProperty.call(e.params.obj, '$ref'))
			{
				if (!this.events
				|| (this.events.emit('onBeforeRef_', e), this.events.emit('onBeforeRef', e), !e.skip)
				)
				{
					//console.log("returning "+e.params.obj['$ref']);
					return objTracker[e.params.obj['$ref']];
				}
				
				if (e.end) return e.params.obj;
				
				e.skip = false;
			}

			if (Object.prototype.hasOwnProperty.call(e.params.obj, '$values') && this.preserveArrays && this.useIdBase)
			{
				e.params.obj = e.params.obj['$values'];
			}

			objTracker[e.params.id] = e.params.obj;

			if (e.params.obj.constructor === Array)
			{
				//console.log('onBeforeWalkArray', e);
				if (!this.events || !this.events.emit('onBeforeWalkArray', e) || !e.skip)
				{
					if (e.end) return e.params.obj;

					for (e.params.i = 0; e.params.i < e.params.obj.length; e.params.i++)
					{
						//console.log('onBeforeWalkArrayElement', e);
						if (!this.events || !this.events.emit('onBeforeWalkArrayElement', e) || !e.skip)
						{
							if (e.end) return e.params.obj;

							e.params.obj[e.params.i] = this.jsponParse(objTracker, e.params.obj[e.params.i], this.useIdBase ? e.params.obj[e.params.i][this.idFieldName] : e.params.id + '[' + e.params.i + ']');

							//console.log('onAfterWalkArrayElement', e);
							if (this.events && this.events.emit('onAfterWalkArrayElement', e) && e.end)
							{
								return e.params.obj;
							}
						}
					}

					//console.log('onAfterWalkArray', e);
					if (this.events && this.events.emit('onAfterWalkArray', e) && e.end)
					{
						return e.params.obj;
					}
				}

			}
			else
			{
				//console.log('onBeforeWalkObject', e);
				if (!this.events || !this.events.emit('onBeforeWalkObject', e) || !e.skip)
				{
					//console.log('onBeforeWalkObject loop', e);
					if (e.end) return e.params.obj;

					for (e.params.key in e.params.obj)
					{
						//console.log('onBeforeWalkObjectElement', e);
						if (!this.events || !this.events.emit('onBeforeWalkObjectElement', e) || !e.skip)
						{
							if (e.end) return e.params.obj;

							e.params.obj[e.params.key] = this.jsponParse(
									  objTracker
									, e.params.obj[e.params.key]
									, this.useIdBase
									? e.params.obj[e.params.key][this.idFieldName]
									: this.useJSONPathDotNotation
									? e.params.id + '.' + e.params.key
									: e.params.id + '[\'' + e.params.key + '\']'
							);

							//console.log('onAfterWalkObjectElement', e);
							if (this.events && this.events.emit('onAfterWalkObjectElement', e) && e.end)
							{
								return e.params.obj;
							}
						}
					}

					//console.log('onAfterWalkObject', e);
					if (this.events && this.events.emit('onAfterWalkObject', e) && e.end)
					{
						return e.params.obj;
					}
				}
			}
			if (this.useIdBase) delete e.params.obj[this.idFieldName];
		}

		//console.log('onAfterWalk', e);
		this.events && this.events.emit('onAfterWalk', e)
	}
	
	return e.params.obj;
}

JSPON.stringify = function(obj)
{
	return JSPON.defaultInstance().stringify(obj);
}

JSPON.prototype.stringify = function(obj) {
	var objTracker = this.isMapSupported ? new Map() : {};
	var newObj = this.jsponClone(objTracker, obj, this.useIdBase ? { uniqueId: 0 } : this.jsonPathRoot);
	if (!this.isMapSupported) {
		for (var x in objTracker) {
			delete objTracker[x][this.idFieldName];
		}
	}
	return this.jsonStringifier(newObj);
}

JSPON.parse = function(str)
{
	return JSPON.defaultInstance().parse(str);
}

JSPON.prototype.parse = function(str) {
	var obj = this.jsonParser(str);
	obj = this.jsponParse({}, obj, this.useIdBase ? obj[this.idFieldName] : this.jsonPathRoot);
	return obj;
}


module.exports = JSPON;

//return {
//parse: parse,
//stringify: stringify,
//setSettings: setSettings,
//getSettings: getSettings
//};
//})();