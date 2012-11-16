/*!
 * Pomelo -- consoleModule serverStop stop/kill
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var logger = require('pomelo-logger').getLogger(__filename);

var TIME_WAIT_KILL = 5000;

module.exports = function(opts) {
	return new Module(opts);
};

module.exports.moduleId = '__stop__';

var Module = function(opts) {
	opts = opts || {};
	this.app = opts.app;
	this.starter = opts.starter;
	this.interval = opts.interval || 5;
};

Module.prototype.monitorHandler = function(agent, msg, cb) {
	this.app.stop(false);
};

Module.prototype.clientHandler = function(agent, msg, cb) {
	var self = this;
	if(msg.signal === 'kill') {
	    var pids = [];
		var serverIds = [];
        for(var sid in agent.idMap) {
			var record = agent.idMap[sid];
			serverIds.push(record.id);
			pids.push(record.pid);
		}
		if(!pids.length || !serverIds.length){
			cb(null, {status : "error"});
			return;
		}
		setTimeout(function() {
			self.starter.kill(self.app, pids, serverIds);
			cb(null, {status : "ok"});
		}, TIME_WAIT_KILL);
	} else if (msg.signal === 'stop') {
		agent.notifyAll(module.exports.moduleId);
		self.app.stop(false);
		cb(null, {status : "ok"});
	}
};
