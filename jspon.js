"use strict";

const Events = require('events');

//const each = require("bloody-collections/lib/each");
function each(list, callback)
{
	for (var i = 0; i < list.length; i++) {
		callback(list[i]);
	}
}

function requireEvents(self)
{
	if (!self.events)
	{
		self.events = new Events.EventEmitter();
	}
	
	return self.events;
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
			const events = requireEvents(self);
			
			if (newSettings[eventName].constructor === Array)
			{
				each(newSettings[eventName], function(callback){events.on(eventName, callback)});
			}
			else
			{
				events.on(eventName, newSettings[eventName]);
			}
		}
	})

	if (Object.prototype.hasOwnProperty.call(newSettings, 'refReplacementsOneToOne'))
	{
		const replacements = this.refReplacementsOneToOne ? this.refReplacementsOneToOne : {};

		if (typeof newSettings.refReplacementsOneToOne == "string")
		{
			replacements['__inline__'] = newSettings.refReplacementsOneToOne;
		}
		else
		{
			for (var key in newSettings.refReplacementsOneToOne)
			{
				replacements[key] = newSettings.refReplacementsOneToOne[key];
			}
		}

		replacements['__pattern__'] = undefined;
		this.refReplacementsOneToOne = replacements;
	}
}


JSPON.prototype.evaluateOneToOneReplacements = function(root)
{
	var rx;

	const replacements = this.refReplacementsOneToOne ? this.refReplacementsOneToOne : {};


	const refReplacementsOneToOneCallback = function(e)
	{
		var x = e.params.obj['$ref'];
		var y;

		while ((y = x.replace(rx, function (match, p1, p2, p3) {return p1+replacements[p2]+p3;})) != x)
		{
			//console.log("replace $ref "+x+" => "+y);

			x = y;
		}

		e.params.obj['$ref'] = x;
	}

	const regExpEscape = function(s)
	{
		return String(s)
			.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1')
			.replace(/\x08/g, '\\x08')
			;
	};

	if (!replacements.__pattern__)
	{
		if (replacements.__inline__)
		{
			const	keys	= replacements.__inline__.split('.')
			var		parent	= root;

			for (var i = 0; root && i < keys.length; i++)
			{
				//console.log(keys[i],parent);
				parent = parent[keys[i]]
			}

			if (typeof parent == "object")
			{
				for (var key in parent)
				{
					if (!replacements[key])
					{
						replacements[key] = parent[key];
					}
				}
			}
		}

		var pattern = "";

		for (var key in replacements)
		{
			//console.log({pattern: pattern, key: key});
			if (key != "__inline__" && key != "__pattern__")
			{
				pattern = pattern + (pattern ? "|" : "") + regExpEscape(key);
			}
		}

		if (pattern)
		{
			replacements.__pattern__ = '(^|\\.)('+pattern+')(\\.|$)';
		}
	}

	const events = requireEvents(this);

	if (replacements.__pattern__)
	{
		//console.log({pattern: replacements.__pattern__, replacements: replacements});
		rx = new RegExp(replacements.__pattern__, "g");

		this.refReplacementsOneToOne = replacements;
		
		events.addListener('onBeforeRef_', refReplacementsOneToOneCallback);
	}
	else if (this.refReplacementsOneToOne)
	{
		events.removeListener('onBeforeRef_', refReplacementsOneToOneCallback);

		this.refReplacementsOneToOne = undefined;
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
	this.evaluateOneToOneReplacements(obj);
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