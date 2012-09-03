var utils = require('./util/utils');

var MasterAgent = require('./masterAgent');
var MonitorAgent = require('./monitorAgent');
var schedule = require('pomelo-schedule');

var nodes = {};
//这些统计的cache要能够动态的增删
//比如说统计各个服务器的systemInfo，如果一台服务器挂了，那么就没有这台服务器的信息

/**
 * ConsoleService Constructor
 * 
 * @param {Object} opts construct parameter
 *                      opts.type {String} server type, 'master' for master server
 *                      opts.id {String} server id
 *                      opts.host {String} (monitor only) master server host
 *                      opts.port {String | Number} listen port for master or master port for monitor
 */
var Service = function(opts) {
	this.type = opts.type;
	this.id = opts.id;
	this.host = opts.host;
	this.port = opts.port;

	this.modules = {};

	if(this.type === 'master') {
		this.agent = new MasterAgent(this);
	} else {
		this.agent = new MonitorAgent({
			consoleService: this, 
			id: this.id, 
			type: this.type
		});
	}
};

module.exports = Service;

var pro = Service.prototype;

pro.start = function(cb) {
	if(this.type === 'master') {
		this.agent.listen(this.port);
		process.nextTick(function() {
			utils.invokeCallback(cb);
		});
	} else {
		this.agent.connect(this.port, this.host, cb);
	}

	for(var mid in this.modules) {
		this.enable(mid);
	}
};

pro.stop = function() {
	for(var mid in this.modules) {
		this.disable(mid);
	}
	this.agent.close();
};

pro.register = function(moduleId, module) {
	this.modules[moduleId] = registerRecord(this, moduleId, module);
};

pro.enable = function(moduleId) {
	var record = this.modules[moduleId];
	if(record && !record.enable) {
		record.enable = true;
		addToSchedule(this, record);
		return true;
	}
	return false;
};

pro.disable = function(moduleId) {
	var record = this.modules[moduleId];
	if(record && record.enable) {
		record.enable = false;
		if(record.schedule && record.jobId) {
			schedule.cancelJob(record.jobId);
			schedule.jobId = null;
		}
		return true;
	}
	return false;
};

pro.execute = function(moduleId, method, msg, cb) {
	var m = this.modules[moduleId];
	if(!m) {
		console.error('unknown module: %j.', moduleId);
		utils.invokeCallback(cb, new Error('unknown module:' + moduleId));
		return;
	}

	if(!m.enable) {
		console.error('module %j is disable.', moduleId);
		utils.invokeCallback(cb, new Error('module ' + moduleId + ' is disable'));
		return;
	}

	var module = m.module;
	if(!module || typeof module[method] !== 'function') {
		console.error('module %j dose not have a method called %j.', moduleId, method);
		utils.invokeCallback(cb, new Error('module ' + moduleId + ' dose not have a method called ' + method));
		return;
	}

	module[method](this.agent, msg, cb);
};

/**
 * 设置状态信息
 */

pro.set = function(moduleId,serverId,value) {
	if(typeof nodes[moduleId] === "undefined"){
		nodes[moduleId] = {};
	}
	if(serverId){
		nodes[moduleId][serverId] = value;
	}else{
		nodes[moduleId] = value;
	}
};

/**
 * 获取状态信息
 */
pro.get = function(moduleId,serverId) {
	if(!moduleId) {
		throw new Error("moduleId is required");
	}
	if(serverId&&nodes[moduleId]&&nodes[moduleId][serverId]){
		return nodes[moduleId][serverId];
	}else if(nodes[moduleId]){
		return nodes[moduleId];
	}// if nodes[moduleId] undefined
	// do it in the specific module
};

var registerRecord = function(service, moduleId, module) {
	var record = {
		moduleId: moduleId, 
		module: module, 
		enable: false
	};

	if(module.type && module.interval) {
		if(service.type !== 'master' && record.module.type === 'push' ||
			service.type === 'master' && record.module.type !== 'push') {
			// push for monitor or pull for master(default)
			record.delay = module.delay || 0;
			record.interval = module.interval || 1;
			// normalize the arguments
			if(record.delay < 0) {
				record.delay = 0;
			}
			if(record.interval < 0) {
				record.interval = 1;
			}
			record.interval = Math.ceil(record.interval);
			record.delay *= 1000;
			record.interval *= 1000;
			record.schedule = true;
		}
	}

	return record;
};

var addToSchedule = function(service, record) {
	if(record && record.schedule) {
		record.jobId = schedule.scheduleJob(
			{start: Date.now() + record.delay, period: record.interval}, 
			doScheduleJob, {service: service, record: record}
		);
	}
};

var doScheduleJob = function(args) {
	var service = args.service;
	var record = args.record;
	if(!service || !record || !record.module || !record.enable) {
		return;
	}

	if(service.type === 'master') {
		record.module.masterHandler(service.agent, null, function(err) {
			console.error('interval push should not have a callback.');
		});
	} else {
		record.module.monitorHandler(service.agent, null, function(err) {
			console.error('interval push should not have a callback.');
		});
	}
};