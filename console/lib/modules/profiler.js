var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);
var utils = require('../util/utils');
var profiler = require('v8-profiler');
var fs = require('fs');
var ProfileProxy = require('../util/profileProxy');

var Module = function(app, isMaster, agent) {
	this.profiles = {
		HEAP: {},
		CPU: {}
	};

	this.isProfilingCPU = false;

	if(isMaster) {
		this.proxy = new ProfileProxy(app.master.wsPort, this);
		this.agent = agent;
		this.proxy.listen();
	}
};

module.exports = Module;
Module.moduleId = 'profiler';

var pro = Module.prototype;

pro.monitorHandler = function(agent, msg, cb) {
	var type = msg.type, action = msg.action, uid = msg.uid, result = null;
	if (type === 'CPU') {
		if (action === 'start') {
			profiler.startProfiling();
			cb();
		} else {
			result = profiler.stopProfiling();
			var res = {};
			res.head = result.getTopDownRoot();
			res.bottomUpHead = result.getBottomUpRoot();
			res.msg = msg;
			cb(null, res);
			//monitorAgent.socket.emit('cpuprofiler', res);
		}
	} else {
		var snapshot = profiler.takeSnapshot();
		var name = process.cwd() + '/logs/' + utils.format(new Date()) + '.log';
		var log = fs.createWriteStream(name, {'flags': 'a'});
		var data = [];
		snapshot.serialize({
			onData: function (chunk, size) {
				chunk = chunk + '';
				log.write(chunk);
				//monitorAgent.socket.emit('heapprofiler', {
				//    method:'Profiler.addHeapSnapshotChunk',
				//    params:{
				//        uid:uid,
				//        chunk:chunk
				//    }
				//});
				data.push({
				    method:'Profiler.addHeapSnapshotChunk',
				    params:{
				        uid:uid,
				        chunk:chunk
				    }
				});
			},
			onEnd: function () {
				/*
				monitorAgent.socket.emit('heapprofiler', {
					method:'Profiler.finishHeapSnapshot',
					params:{
						uid:uid
					}
				});*/
				cb(null, data);
				profiler.deleteAllSnapshots();
			}
		});
	}
};

pro.masterHandler = function(agent, msg, cb) {
};

pro.clientHandler = function(agent, msg, cb) {
	if(msg.action === 'list') {
		list(agent, msg, cb);
		return;
	}

	agent.request(msg.uid, Module.moduleId, msg, function(err, res) {
		if(err) {
			logger.error('fail to profile %j for %j', msg.type, msg.uid);
			cb(err.msg);
			return;
		}

		cb(null, res);
	});
};

var list = function(agent, msg, cb) {
	var servers = [];
	var idMap = agent.idMap;

	for(var sid in idMap){
		servers.push(sid);
	}
	cb(null, servers);
};