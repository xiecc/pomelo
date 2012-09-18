var fs = require('fs');
var WebSocketServer = require('ws').Server;

var HeapProfileType = 'HEAP';
var CPUProfileType = 'CPU';

var host = '0.0.0.0';

var Proxy = function(port, profile){
	this.port = port;
	this.profile = profile;

	this.profiles = {
		HEAP: {},
		CPU: {}
	};

	this.isProfilingCPU = false;
};

module.exports = Proxy;

var pro = Proxy.prototype;

pro.listen = function() {
	this.wss = new WebSocketServer({
		port: this.port,
		host: host
	});

	var self = this;
	this.wss.on('connection', function(socket) {
		socket.on('message', function(message) {
			try {
				message = JSON.parse(message);
			} catch (e) {
				console.log(e);
				return;
			}

			var id = message.id;
			var command = message.method.split('.');
			var method = command[1];
			var params = message.params;

			if (!self[method] || typeof self[method] !== 'function') {
				return;
			}

			self.setSocket(socket);
			self[method](id, params);
		});
	});
};

pro.close = function() {
	this.wss.close();
};

pro.enable = function(id, params) {
	this.sendResult(id,{
		result : true
	});
};

pro.causesRecompilation = function(id, params) {
	this.sendResult(id,{
		result: false
	});
};

pro.isSampling = function(id, params) {
	var self = this;
	self.sendResult(id,{
		result: true
	});
};

pro.hasHeapProfiler = function(id, params) {
	var self = this;
	self.sendResult(id,{
		result: true
	});
};

pro.getProfileHeaders = function(id, params) {
	var headers = [];
	var self = this;
	for (var type in this.profiles) {
		for (var profileId in this.profiles[type]) {
			var profile = this.profiles[type][profileId];
			headers.push({
				title: profile.title,
				uid: profile.uid,
				typeId: type
			});
		}
	}
	self.sendResult(id, {
		headers: headers
	});
};

pro.takeHeapSnapshot = function(id, params) {
	var uid = params.uid;
	var self = this;

	/*
	var server = require('./server').serverAgent;
	var node = server.nodes[uid];
	
	if (!node) {
		return;
	}
	node.socket.emit('profiler', { type: 'heap', action: 'start', uid: uid });*/

	this.profile.clientHandler(this.profile.agent, {type: 'heap', action: 'start', uid: uid}, function(err, res) {
		for(var i=0, l=res.length; i<l; i++) {
			self.takeSnapCallBack(res[i]);
		}
		self.takeSnapCallBack({params: {uid: uid}});
	});

	self.sendEvent({method: 'Profiler.addProfileHeader', params: {header: {title: uid, uid: uid, typeId: HeapProfileType}}});
	self.sendResult(id, {});
};

pro.takeSnapCallBack = function (data) {
	var self = this;
	if(!data.params) {
		console.error(data);
	}
	var uid = data.params.uid || 0;
	var snapShot = self.profiles[HeapProfileType][uid];
	if (!snapShot || snapShot.finish) {
		snapShot = {};
		snapShot.data = [];
		snapShot.finish = false;
		snapShot.uid = uid;
		snapShot.title = uid;
	}
	if (data.method === 'Profiler.addHeapSnapshotChunk') {
		var chunk = data.params.chunk;
		snapShot.data.push(chunk);
	} else {
		snapShot.finish = true;
	}
	self.profiles[HeapProfileType][uid] = snapShot;
};

pro.getProfile = function(id, params) {
	var profile = this.profiles[params.type][params.uid];
	var self = this;
	if (!profile || !profile.finish) {
		var timerId = setInterval(function() {
			profile = self.profiles[params.type][params.uid];
			if (!!profile) {
				clearInterval(timerId);
				self.asyncGet(id, params, profile);
			} else {
				console.error('please wait ..............');
			}
		}, 5000);
	} else {
		self.asyncGet(id,params, profile);
	}
};

pro.asyncGet = function(id, params, snapshot) {
	var uid = params.uid;
	var self = this;
	if (params.type === HeapProfileType) {
		for (var index in snapshot.data) {
			var chunk = snapshot.data[index];
			self.sendEvent({method: 'Profiler.addHeapSnapshotChunk', params: {uid: uid, chunk: chunk}});
		}
		self.sendEvent({method: 'Profiler.finishHeapSnapshot', params: {uid: uid}});
		self.sendResult(id, {profile: {title: snapshot.title, uid: uid, typeId: HeapProfileType}});
		console.log('finished~~~~~~~~~~~~~~~~~~~`heap');
	} else if (params.type === CPUProfileType) {
		self.sendResult(id,{
			profile: {
				title: snapshot.title,
				uid: uid,
				typeId: CPUProfileType,
				head: snapshot.data.head,
				bottomUpHead: snapshot.data.bottomUpHead
			}
		});
	}
};

pro.clearProfiles = function(id, params) {
	this.profiles.HEAP = {};
	this.profiles.CPU = {};
	//profiler.deleteAllSnapshots();
	//profiler.deleteAllProfiles();
};

pro.setSocket = function(socket){
	this.socket = socket;
};

pro.sendResult = function(id, res){
	if (!!this.socket) {
		this.socket.send(JSON.stringify({id: id, result: res}));
	}
};


pro.sendEvent = function(res){
	if (!!this.socket) {
		this.socket.send(JSON.stringify(res));
	}
};

pro.start = function(id, params) {
	var uid = params.uid;
	var self = this;
	/*
	var server = require('./server').serverAgent;
	var node = server.nodes[uid];
	var self = this;
	if (!!node) {
		node.socket.emit('profiler', { type: 'CPU', action: 'start', uid: uid });
		self.sendEvent({ method: 'Profiler.setRecordingProfile', params: { isProfiling: true } });
	}
	*/

	this.profile.clientHandler(this.profile.agent, {type: 'CPU', action: 'start', uid: uid}, function(err, res) {
		self.sendEvent({method: 'Profiler.setRecordingProfile', params: {isProfiling: true}});
		self.sendResult(id, {});
	});
	//self.sendResult(id,{});
};

pro.stop = function(id, params) {
	var uid = params.uid;
	var self = this;
	/*
	var server = require('./server').serverAgent;
	var node = server.nodes[uid];
	if (!node) {
		return;
	}
	node.socket.emit('profiler', { type: 'CPU', action: 'stop', uid: uid });
	 */
	this.profile.clientHandler(this.profile.agent, {type: 'CPU', action: 'stop', uid: uid}, function(err, res) {
		self.stopCallBack(res);
	});
};

pro.stopCallBack = function(res) {
	var self = this;
	var uid = res.msg.uid;
	var profiler = self.profiles[CPUProfileType][uid];
	if (!profiler || profiler.finish){
		profiler = {};
		profiler.data = null;
		profiler.finish = true;
		profiler.typeId = CPUProfileType;
		profiler.uid = uid;
		profiler.title = uid;
	}
	profiler.data = res;
	self.profiles[CPUProfileType][uid] = profiler;
	self.sendEvent({method: 'Profiler.addProfileHeader', params: {header: {title: profiler.title, uid: uid, typeId: CPUProfileType}}});
};