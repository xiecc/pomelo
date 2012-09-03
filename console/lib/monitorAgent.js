var sclient = require('socket.io-client');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var utils = require('./util/utils');
var protocol = require('./util/protocol');

var ST_INITED = 1;
var ST_CONNECTED = 2;
var ST_REGISTERED = 3;
var ST_CLOSED = 4;
var STATUS_INTERVAL = 5 * 1000; // 60 seconds

var MonitorAgent = function(opts) {
	EventEmitter.call(this);
	this.consoleService = opts.consoleService;
	this.id = opts.id;
	this.type = opts.type;
	this.socket = null;
	this.reqId = 1;
	this.callbacks = {};
	this.state = ST_INITED;
};

util.inherits(MonitorAgent, EventEmitter);

module.exports = MonitorAgent;

var pro = MonitorAgent.prototype;

pro.connect = function(port, host, cb) {
	if(this.state > ST_INITED) {
		console.error('monitor client has connected or closed.');
		return;
	}

	this.socket = sclient.connect(host + ':' + port, {'force new connection': true, 'reconnect': false});
	
	var self = this;
	this.socket.on('register', function(msg) {
		if(msg && msg.code === protocol.PRO_OK) {
			self.state = ST_REGISTERED;
			utils.invokeCallback(cb);
		}
	});

	this.socket.on('monitor', function(msg) {
		if(self.state !== ST_REGISTERED) {
			return;
		}

		msg = protocol.parse(msg);
		// request from master
		self.consoleService.execute(msg.moduleId, 'monitorHandler', msg.body, function(err, res) {
			if(protocol.isRequest(msg)) {
				var resp = protocol.composeResponse(msg, err, res);
				if(resp) {
					self.socket.emit('monitor', resp);
				}
			} else {
				//notify should not have a callback
				console.error('notify should not have a callback.');
			}
		});
	});
	
	this.socket.on('connect', function() {
		if(self.state > ST_INITED) {
			//ignore reconnect
			return;
		}
		self.state = ST_CONNECTED;
		var req = {
			id: self.id, 
			type: self.type
		};
		self.socket.emit('register', req);
	});
	
	this.socket.on('error', function(err) {
		if(self.state < ST_CONNECTED) {
			// error occurs during connecting stage
			utils.invokeCallback(cb, err);
		} else {
			self.emit('error', err);
		}
	});
	
	this.socket.on('disconnect', function(reason) {
		if(reason === 'booted') {
			//disconnected by call disconnect function
			this.state = ST_CLOSED;
			self.emit('close');
		} else {
			//some other reason such as heartbeat timeout
		}
	});

	//interval push
	setInterval(function(){
		self.consoleService.execute("systemInfo", 'monitorHandler', {}, function(err, res) {
			if(res) {
				// ignore error for notify
				var req = protocol.composeRequest(null, "systemInfo", res);
				self.socket.emit('monitor', req);
			}
		});
	},STATUS_INTERVAL);

	setInterval(function(){
		self.consoleService.execute("nodeInfo", 'monitorHandler', {}, function(err, res) {
			if(res) {
				// ignore error for notify
				var req = protocol.composeRequest(null, "nodeInfo", res);
				self.socket.emit('monitor', req);
			}
		});
	},STATUS_INTERVAL);
};

pro.close = function() {
	if(this.state >= ST_CLOSED) {
		return;
	}
	this.state = ST_CLOSED;
	this.socket.disconnect();
};

pro.notify = function(moduleId, msg) {
	if(this.state !== ST_REGISTERED) {
		console.error('agent can not notify now, state:' + this.state);
		return;
	}
	this.socket.emit('monitor', protocol.composeRequest(null, moduleId, msg));
};