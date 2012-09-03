var utils = require('./util/utils');

var MasterAgent = require('./masterAgent');
var MonitorAgent = require('./monitorAgent');

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
};

pro.stop = function() {
	this.agent.close();
};

pro.register = function(moduleId, module) {
	this.modules[moduleId] = registerRecord(module);
};

pro.enable = function(moduleId) {
	var m = this.modules[moduleId];
	if(m) {
		m.enable = true;
		return true;
	}
	return false;
};

pro.disable = function(moduleId) {
	var m = this.modules[moduleId];
	if(m) {
		m.enable = false;
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

	if(method === 'clientHandler') {
		console.log("consoleService clientHandler");
		module.clientHandler(this.agent, msg, cb);
	} else {
		module[method](msg, cb);
	}
};

/**
 * 设置状态信息
 */
pro.set = function(moduleId,serverId,value) {
	if(typeof nodes[moduleId] == "undefined"){
		nodes[moduleId] = {};
	}
	if(serverId){
		nodes[moduleId][serverId] = value;
	}
};

/**
 * 获取状态信息
 */
pro.get = function(moduleId,serverId) {
	if(!moduleId) throw new Error("moduleId is required");
	if(serverId&&nodes[moduleId]&&nodes[moduleId][serverId]){
		return nodes[moduleId][serverId];
	}else if(nodes[moduleId]){
		return nodes[moduleId];
	}else{
		nodes[moduleId] = {};
	}
};




var registerRecord = function(module) {
	return {
		module: module, 
		enable: true
	};
};