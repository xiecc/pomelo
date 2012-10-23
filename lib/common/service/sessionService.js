var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');

var socketMap = {};
var uidMap = {};
var msgQueues = {};

/**
 * Manager session.
 * 
 * @module
 */
var SessionService = module.exports;

/**
 * Interal session class.
 *
 * @class
 * @constructor
 */
var InterSession = function(opts) {
	EventEmitter.call(this);
	this.uid = '';
	for(var f in opts) {
		this[f] = opts[f];
	}
};
util.inherits(InterSession, EventEmitter);

/**
 * Export session's data field except key and socket.
 * @api public
 */
InterSession.prototype.exportSession = function() {
	var res = {};
	for(var f in this) {
		if(f === 'key' || f === 'socket' || typeof this[f] === 'function') {
			continue;
		}
		res[f] = this[f];
	}
	return res;
};

/**
 * Clone session.
 *
 * @api public
 */
InterSession.prototype.cloneSession = function() {
	var res = {};

	for(var f in this) {
		res[f] = this[f];
	}

	return res;
};

/**
 * Bind the session with the the uid.
 *
 * @param {Number} uid userId
 * @api public
 */
InterSession.prototype.bind = function(uid) {
	//get origin session instance
	var session = SessionService.getSession(this.key);
	if(!session) {
		return false;
	}

	if(session.uid) {
		return false;
	}
	set(this, 'uid', uid);
	uidMap[uid] = session;
	this.emit('bind', session);
	return true;
};

/**
 * Set value for the session.
 *
 * @param {String} key session key
 * @param {Object} value session key
 * @api public
 */
InterSession.prototype.set = function(key, value) {
	set(this, key, value);
};

/**
 * Bind event for the session.
 *
 * @api public
 */
InterSession.prototype.on = function() {
	var session = SessionService.getSession(this.key);
	if(!session) {
		return false;
	}
	EventEmitter.prototype.on.apply(session, arguments);
};

/**
 * Emit a event for the session.
 *
 * @api public
 */
InterSession.prototype.emit = function() {
	var session = SessionService.getSession(this.key);
	if(!session) {
		return false;
	}
	EventEmitter.prototype.emit.apply(session, arguments);
};

/**
 * Closing callback for the session.
 *
 * @api public
 */
InterSession.prototype.closing = function() {
	var reason = this.isKicked ? 'kick' : null;
	this.emit('closing', this, reason);
};

/**
 * Closed callback for the session.
 *
 * @api public
 */
InterSession.prototype.closed = function() {
	if(!!this._closed) {
		return;
	}
	set(this, '_closed', true);
	delete socketMap[this.key];
	delete msgQueues[this.key];
	delete uidMap[this.uid];
	set(this, 'uid', null);

	var reason = this.isKicked ? 'kick' : null;
	this.emit('closed', this, reason);
};

/**
 * Send message to client directly or cache it in a queue and flush later
 */
SessionService.sendDirectly = false;

/**
 * Create and return session.
 * 
 * @param {Object} opts {key:obj, uid: str,  and etc.}
 * @param {Boolean} force whether replace the origin session if it already existed
 * @return {InterSession}
 * @memberOf SessionService
 */
SessionService.createSession = function(opts, force) {
	if(!opts || !opts.key) {
		throw new Error('opts or opts.key should not be empty.');
	}

	if(!!socketMap[opts.key] && !force) {
		return null;
	}

	var session = new InterSession(opts);
	socketMap[opts.key] = session;
	return session;
};

/**
 * Get session by key.
 *
 * @param {Number} key the session' key
 * @return {InterSession}
 * @memberOf SessionService
 */
SessionService.getSession = function(key) {
	return socketMap[key];
};

/**
 * Get session by userId.
 *
 * @param {Number} uid userId
 * @return {InterSession} 
 * @memberOf SessionService
 */
SessionService.getSessionByUid = function(uid) {
	return uidMap[uid];
};

/**
 * Remove session by key.
 *
 * @param {Number} key the session' key
 * @memberOf SessionService
 */
SessionService.removeSession = function(key) {
	delete socketMap[key];
};

/**
 * Kick a user offline.
 *
 * @param {Number} uid userId
 * @param {Function} cb callback function
 * @memberOf SessionService
 */
SessionService.kick = function(uid, cb) {
	logger.debug('kick off user:' + uid);
	var session = SessionService.getSessionByUid(uid);

	if(session) {
		//make sure has been kicked
		session.isKicked = true;
		session.socket.emit('message', {route: 'onKick'});
		process.nextTick(function() {
			session.socket.disconnect();
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
 * @param {String} id session id
 * @param {Object} msg message to send
 * @memberOf SessionService
 */
SessionService.sendMessage = function(id, msg) {
	if(!socketMap[id]) {
		logger.error('fail to send message for socket not exits');
		return false;
	}

	if(!!SessionService.sendDirectly) {
		socketMap[id].socket.send(encode(msg));
		return true;
	}

	var queue = msgQueues[id];
	if(!queue) {
		queue = [];
		msgQueues[id] = queue;
	}

	queue.push(msg);
	return true;
};

/**
 * Send message to the client by user id.
 *
 * @param {String} uid userId
 * @param {Object} msg message to send
 * @memberOf SessionService
 */
SessionService.sendMessageByUid = function(uid, msg) {
	var session = uidMap[uid];
	if(!session) {
		logger.error('fail to send message by uid for session not exist. uid: %j', uid);
		return false;
	}

	return SessionService.sendMessage(session.key, msg);
};

/**
 * Flush messages to clients.
 */
SessionService.flush = function() {
	var queue, session;
	for(var id in msgQueues) {
		queue = msgQueues[id];
		if(!queue || queue.length === 0) {
			continue;
		}

		session = socketMap[id];
		if(!session || !session.socket) {
			logger.error('fail to send message for socket not exist.');
			delete msgQueues[id];
			continue;
		}
		session.socket.send(encode(msgQueues[id]));
		msgQueues[id] = [];
	}
};

/**
 *
 * Encode msg to client
 *
 *
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

/**
 * Util function that set value for session.
 */
var set = function(origin, key, value) {
	var session = SessionService.getSession(origin.key);
	if(!session) {
		return false;
	}

	session[key] = value;
	origin[key] = value;
};