var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');

var IMPORT_EXCLUDE_FIELDS = ['id', '__socket__', 'frontendId', '__sessionService__', '__state__'];
var MOCK_EXCLUDE_FIELDS = ['__socket__', '__state__'];
var EXPORT_EXCLUDE_FIELDS = ['__socket__', '__session__', '__sessionService__'];

var ST_INITED = 0;
var ST_CLOSED = 1;

/**
 * Manager session.
 * 
 * @module
 */
var SessionService = function(opts) {
	opts = opts || {};
	this.sendDirectly = opts.sendDirectly;
	this.sessions = {};
	this.uidMap = {};
	this.msgQueues = {};
};

module.exports = SessionService;

/**
 * Create and return session.
 * 
 * @param {Object} opts {key:obj, uid: str,  and etc.}
 * @param {Boolean} force whether replace the origin session if it already existed
 * @return {Session}
 * @memberOf SessionService
 */
SessionService.prototype.create = function(sid, frontendId, socket) {
	var session = new Session(sid, frontendId, socket, this);
	this.sessions[session.id] = session;

	return session;
};

SessionService.prototype.bind = function(sid, uid, cb) {
	var session = this.sessions[sid];

	if(!session) {
		cb(new Error('session not exist, sid: ' + sid));
		return;
	}

	session.bind(uid);
	cb();
};

/**
 * Get session by id.
 *
 * @param {Number} id The session id
 * @return {Session}
 * @memberOf SessionService
 */
SessionService.prototype.get = function(sid) {
	return this.sessions[sid];
};

/**
 * Get session by userId.
 *
 * @param {Number} uid User id associated with the session
 * @return {Session} 
 * @memberOf SessionService
 */
SessionService.prototype.getByUid = function(uid) {
	return this.uidMap[uid];
};

/**
 * Remove session by key.
 *
 * @param {Number} sid The session id
 * @memberOf SessionService
 */
SessionService.prototype.remove = function(sid) {
	var session = this.sessions[sid];
	if(session) {
		delete this.sessions[session.id];
		delete this.uidMap[session.uid];
		delete this.msgQueues[session.id];
	}
};

SessionService.prototype.import = function(sid, session, cb) {
	var osession = this.sessions[sid];
	if(!osession) {
		cb(new Error('session not exist, sid: ' + sid));
		return;
	}

	clone(session, osession, IMPORT_EXCLUDE_FIELDS);
	cb();
};

/**
 * Kick a user offline.
 *
 * @param {Number} uid User id asscociated with the session
 * @param {Function} cb Callback function
 * @memberOf SessionService
 */
SessionService.prototype.kick = function(uid, cb) {
	var session = this.getByUid(uid);

	if(session) {
		//make sure has been kicked
		session.__socket__.send({route: 'onKick'});
		process.nextTick(function() {
			session.closed('kick');
			utils.invokeCallback(cb);
		});
	} else {
		process.nextTick(function() {
			utils.invokeCallback(cb);
		});
	}
};

/**
 * Send message to the client by session id.
 *
 * @param {String} sid session id
 * @param {Object} msg message to send
 * @memberOf SessionService
 */
SessionService.prototype.sendMessage = function(sid, msg) {
	var session = this.sessions[sid];

	if(!session) {
		logger.debug('fail to send message for session not exits');
		return false;
	}

	return send(this, session, msg);
};

/**
 * Send message to the client by user id.
 *
 * @param {String} uid userId
 * @param {Object} msg message to send
 * @memberOf SessionService
 */
SessionService.prototype.sendMessageByUid = function(uid, msg) {
	var session = this.uidMap[uid];

	if(!session) {
		logger.debug('fail to send message by uid for session not exist. uid: %j', uid);
		return false;
	}

	return send(this, session, msg);
};

var send = function(service, session, msg) {
	if(service.sendDirectly) {
		session.__socket__.send(encode(msg));
		return true;
	}

	var sid = session.id;
	var queue = service.msgQueues[sid];
	if(!queue) {
		queue = [];
		service.msgQueues[sid] = queue;
	}

	queue.push(msg);
	return true;
};

/**
 * Flush messages to clients.
 */
SessionService.prototype.flush = function() {
	var queues = this.msgQueues, sessions = this.sessions, queue, session;
	for(var sid in queues) {
		queue = queues[sid];
		if(!queue || queue.length === 0) {
			continue;
		}

		session = sessions[sid];
		if(session && session.__socket__) {
			session.__socket__.send(encode(queue));
		} else {
			logger.debug('fail to send message for socket not exist.');
		}

		delete queues[sid];
	}
};

/**
 * Session class.
 *
 * @class
 * @constructor
 */
var Session = function(sid, frontendId, socket, service) {
	EventEmitter.call(this);
	this.id = sid;					// r
	this.frontendId = frontendId;	// r
	this.uid = null;				// r

	// private
	this.__socket__ = socket;
	this.__sessionService__ = service;
	this.__state__ = ST_INITED;
};

util.inherits(Session, EventEmitter);

Session.prototype.mockLocalSession = function() {
	return new MockLocalSession(this);
};

/**
 * Bind the session with the the uid.
 *
 * @param {Number} uid User id
 * @api public
 */
Session.prototype.bind = function(uid) {
	this.__sessionService__.uidMap[uid] = this;
	this.set('uid', uid);
	this.emit('bind', uid);
};

/**
 * Set value for the session.
 *
 * @param {String} key session key
 * @param {Object} value session value
 * @api public
 */
Session.prototype.set = function(key, value) {
	this[key] = value;
};

/**
 * Get value from the session.
 *
 * @param {String} key session key
 * @return {Object} value associated with session key
 * @api public
 */
Session.prototype.get = function(key, value) {
	return this[key];
};

/**
 * Closed callback for the session.
 *
 * @api public
 */
Session.prototype.closed = function(reason) {
	if(this.__state__ === ST_CLOSED) {
		return;
	}
	this.__state__ = ST_CLOSED;
	this.__sessionService__.remove(this.id);
	this.emit('closed', this, reason);
	this.__socket__.disconnect();
};

var MockLocalSession = function(session) {
	EventEmitter.call(this);
	clone(session, this, MOCK_EXCLUDE_FIELDS);
	this.__session__ = session;
};

util.inherits(MockLocalSession, EventEmitter);

MockLocalSession.prototype.bind = function(uid, cb) {
	var self = this;
	this.__sessionService__.bind(this.id, uid, function(err) {
		if(!err) {
			self.uid = uid;
		}
		cb(err);
	});
};

MockLocalSession.prototype.set = function(key, value) {
	this[key] = value;
};

MockLocalSession.prototype.get = function(key) {
	return this[key];
};

MockLocalSession.prototype.push = function(key, cb) {
	var nsession = {key: this.get(key)};
	this.__sessionService__.import(this.id, nsession, cb);
};

MockLocalSession.prototype.pushAll = function(cb) {
	this.__sessionService__.import(this.id, this, cb);
};

MockLocalSession.prototype.on = function(event, listener) {
	EventEmitter.prototype.on.call(this, event, listener);
	this.__session__.on(event, listener);
};

MockLocalSession.prototype.export = function() {
	var res = {};
	clone(this, res, EXPORT_EXCLUDE_FIELDS);
	return res;
};

var clone = function(src, dest, excludes) {
	var v;
	for(var f in src) {
		if(!src.hasOwnProperty(f)) {
			continue;
		}
		if(excludes.indexOf(f) >= 0) {
			continue;
		}
		v = src[f];
		if(typeof v === 'function') {
			continue;
		}
		dest[f] = v;
	}
};

/**
 * Encode msg to client
 */
var encode = function(msgs){
	var res = '[', msg;
	for(var i=0, l=msgs.length; i<l; i++) {
		if(i > 0) {
			res += ',';
		}
		msg = msgs[i];
		if(typeof msg === 'string') {
			res += msg;
		} else {
			res += JSON.stringify(msg);
		}
	}
	res += ']';
	return res;
};