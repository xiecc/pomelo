/**
 * Mock session service for sessionService
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var LocalSessionService = function(app) {
	this.app = app;
};

module.exports = LocalSession;
/**
 * Mock session service for sessionService
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var LocalSessionService = function(app) {
	this.app = app;
};

module.exports = LocalSessionService;

LocalSessionService.prototype.create = function(opts) {
	if(!opts) {
		throw new Error('opts should not be empty.');
	}
	return new LocalSession(opts, this);
};

LocalSessionService.prototype.bind = function(frontendId, sid, uid, cb) {
	var namespace = 'sys';
	var service = 'sessionRemote';
	var method = 'bind';
	var args = [sid, uid];
	rpcInvoke(this.app, frontendId, namespace, service, method, args, cb);
};

LocalSessionService.prototype.push = function(frontendId, sid, content, cb) {
	var namespace = 'sys';
	var service = 'sessionRemote';
	var method = 'push';
	var args = [sid, content];
	rpcInvoke(this.app, frontendId, namespace, service, method, args, cb);
};

var rpcInvoke = function(app, sid, namespace, service, method, args, cb) {
	app.rpcInvoke(sid, {namespace: namespace, service: service, method: method, args: args}, cb);
};

var LocalSession = function(opts, service) {
	EventEmitter.call(this);
	for(var f in opts) {
		this[f] = opts[f];
	}
	this.__sessionService__ = service;
};

util.inherits(LocalSession, EventEmitter);

LocalSession.prototype.bind = function(uid, cb) {
	var self = this;
	this.__sessionService__.bind(this, uid, function(err) {
		if(!err) {
			self.uid = uid;
		}
		cb(err);
	});
};

LocalSession.prototype.set = function(key, value) {
	this[key] = value;
};

LocalSession.prototype.get = function(key) {
	return this[key];
};

LocalSession.prototype.push = function(key, cb) {
	var content = {};
	content[key] = this.get(key);
	this.__sessionService__.push(this.frontendId, this.id, content, cb);
};

LocalSession.prototype.pushAll = function(cb) {
	this.__sessionService__.push(this.frontendId, this.id, this, cb);
};

LocalSession.prototype.export = function() {
	var res = {};
	for(var f in this) {
		if(!this.hasOwnProperty(f)) {
			res[f] = this[f];
		}
	}
	return this;
};

var rpcInvoke = function(app, sid, namespace, service, method, args, cb) {
	app.rpcInvoke(sid, {namespace: namespace, service: service, method: method, args: args}, cb);
};
