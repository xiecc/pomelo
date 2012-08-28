var utils = require('./util/utils');

var MasterAgent = require('./masterAgent');
var MonitorAgent = require('./monitorAgent');

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
		module.clientHandler(this.agent, msg, cb);
	} else {
		module[method](msg, cb);
	}
};

var registerRecord = function(module) {
	return {
		module: module, 
		enable: true
	};
};