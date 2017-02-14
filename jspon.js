"use strict";

var i = 0;
var defaultInstance;

var JSPON = module.exports = function(config)
{

	if (!(this instanceof JSPON))
	{
		return JSPON.defaultInstance(config);
	}

	this.idFieldName = 'b5b813f0-9f2c-4fd5-893e-c1bc36f2aa48';
	this.useIdBase = false;
	this.preserveArrays = true;
	this.jsonParser = JSON.parse;
	this.jsonStringifier = JSON.stringify;
	this.jsonPathRoot = '$';
	this.useJSONPathDotNotation = true;
	this.i = ++i;
	function onWalk(loc, expression, value, path) {};
	this.onWalk = function(loc, expression, value, path) {};
	this.onWalk = onWalk;
	
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
		this.preserveArrays = newSettings.this.preserveArrays;
	} else {
		this.preserveArrays = true;
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'jsonPathRoot')) {
		this.jsonPathRoot = newSettings.this.jsonPathRoot;
		this.useIdBase = false;
		this.idFieldName = undefined;
	} else {
		this.jsonPathRoot = '$';
		this.useIdBase = false;
		this.idFieldName = undefined;
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'jsonPathFormat')) {
		if (newSettings['jsonPathFormat'] === 'BracketNotation') {
			this.useJSONPathDotNotation = false;
		} else {
			this.useJSONPathDotNotation = true;
		}
	} else {
		this.useJSONPathDotNotation = true;
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'idFieldName')) {
		this.idFieldName = newSettings.this.idFieldName;
		this.useIdBase = true;
		this.jsonPathRoot = undefined;
	} else {
		this.idFieldName = 'b5b813f0-9f2c-4fd5-893e-c1bc36f2aa48';
		this.useIdBase = false;
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'jsonParser')) {
		this.jsonParser = newSettings.parse;
	} else {
		this.jsonParser = JSON.parse;
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'jsonStringifier')) {
		this.jsonStringifier = newSettings.stringify
	} else {
		this.jsonStringifier = JSON.stringify;
	}

	if (Object.prototype.hasOwnProperty.call(newSettings, 'onWalk'))
	{
		if (newSettings.onWalk.constructor === Array)
		{
			this.onWalk = newSettings.onWalk;
		}
		else if (this.onWalk.constructor === Array)
		{
			this.onWalk.push(newSettings.onWalk);
		}
		else
		{
			this.onWalk = [newSettings.onWalk];
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

JSPON.onEvent = function(event, arguments)
{
	if (this[event] !== undefined)
	{
		if (!Array.isArray(this[event]))
		{
			this. = [ this[event] ];
		}

		for (var i = 0; i < this[event].length; i++)
		{
			if (this[event][i].constructor === Function)
			{
				obj = this[event][i](id, obj) || obj;
			}
		}
	}

}

JSPON.jsponParse = function(objTracker, obj, id)
{
	return JSPON.defaultInstance().jsponParse(objTracker, obj, id);
}

JSPON.prototype.jsponParse = function(objTracker, obj, id)
{
	this.onEvent('onWalk', arguments);
	
	if (obj && typeof obj === 'object') {
		if (Object.prototype.hasOwnProperty.call(obj, '$ref')) {
			return objTracker[obj['$ref']];
		}
		if (Object.prototype.hasOwnProperty.call(obj, '$values') && this.preserveArrays && this.useIdBase) {
			obj = obj['$values'];
		}
		objTracker[id] = obj;
		if (obj.constructor === Array) {
			var tempObj = {};
			var allWithId = true;

			for (var i = 0; i < obj.length; i++) {
				obj[i] = this.jsponParse(objTracker, obj[i], this.useIdBase ? obj[i][this.idFieldName] : id + '[' + i + ']');
				if (obj[i]
				&& typeof obj[i] === 'object'
					&& Object.prototype.hasOwnProperty.call(obj[i], 'id'))
				{
					objTracker[id+'.'+obj[i].id] = obj[i];
					if (allWithId)
					{
						tempObj[obj[i].id] = obj[i];
					}
				}
				else
				{
					allWithId = false;
				}
			}

			if (allWithId)
			{
				obj = tempObj;
			}
		} else {
			for (var key in obj) {
				obj[key] = this.jsponParse(objTracker, obj[key], this.useIdBase ? obj[key][this.idFieldName] : this.useJSONPathDotNotation ? id + '.' + key : id + '[\'' + key + '\']');
			}
		}
		if (this.useIdBase) delete obj[this.idFieldName];
	}
	return obj;
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
	return this.jsponParse({}, obj, this.useIdBase ? obj[this.idFieldName] : this.jsonPathRoot);
}

//return {
//parse: parse,
//stringify: stringify,
//setSettings: setSettings,
//getSettings: getSettings
//};
//})();