/**
 * Mock session service for sessionService
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * session service for servers except connector server
 */
var exp = module.exports;

var MockSession = function(opts) {
	EventEmitter.call(this);
	for(var f in opts) {
		this[f] = opts[f];
	}
};
util.inherits(MockSession, EventEmitter);

var pro = MockSession.prototype;

pro.exportSession = function() {
	var res = {};
	
	for(var f in this) {
		if(f === 'key' || typeof this[f] === 'function') {
			continue;
		}
		
		res[f] = this[f];
	}
	
	return res;
};

pro.cloneSession = function() {
  //just for mock
  return this;
};

pro.bind = function(uid) {
	return false;
};

pro.set = function(key, value) {
	this[key] = value;
};

pro.get = function(key) {
	return this[key];
};

pro.push = function(key, cb) {

};

pro.pushAll = function(cb) {

};

pro.closing = function() {
	throw new Error('[UnSupportMethod]  closing is not support in mocksession!');
};

pro.closed = function() {
	throw new Error('[UnSupportMethod]  closed is not support in mocksession!');
};

exp.createSession = function(opts) {
	if(!opts) {
		throw new Error('opts should not be empty.');
	}
	return new MockSession(opts);
};
