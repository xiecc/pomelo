 /*!
 * Pomelo -- consoleService
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitorAgent = require('./monitorAgent.js').monitorAgent;
var masterAgent = require('./masterAgent.js').masterAgent;
var logger = require('./util/log/log').getLogger(__filename);
var util = require('util');

var systemInfo = []; // mem cache
var processInfo = []; 
var nodes = {};

/**
 * 构造ConsoleService
 * 
 * @param options 初始化参数{serverId, serverType, host, port}
 */
var consoleService = function(options) {
	this._serverId = options['serverId'];
	this._serverType = options['serverType'];
	this._host = options['host'];
	this._port = options['port'];
	this._masterHost = options['masterHost'];
	this._masterPort = options['masterPort'];
	this._modules = {};
};

var pro = consoleService.prototype;

/**
 * 注册module
 * module record：{enable, module}
 * map: moduleId -> record
 */
pro.register = function(moduleId,module) {
	this._modules[moduleId] = module;
};

/**
 * 根据serverType决定启动master或monitor agent
 */
pro.start = function(service,cb) {
	if(this._serverType == "master"){
		console.log("start master");
		var master = new masterAgent(service);
		//console.log(util.inspect(master, false, null));
		master.listen(this._port);
	}else if(this._serverType == "monitor"){
		console.log("start monitor");
		var monitor = new monitorAgent(service);
		monitor.connect(this._masterHost,this._masterPort);
	}
};

/**
 * 停止consoleService并关闭底层的agent
 */
pro.close = function(cb) {
};

/**
 * 启用指定的已注册模块
 */
pro.enable = function(moduleId) {
};

/**
 * 停用指定的已注册模块
 */
pro.disable = function(moduleId) {
};

/**
 * 处理消息，先判断对应的module是否已被停用
 */
pro.execute = function(agent,moduleId,handler,msg,cb) {
	var self = this;
	if(this._serverType == "master"){
		if(handler == "request"){
			if(msg.monitorId){
				agent.notifyById(msg.monitorId,moduleId,msg);
			}else if(msg.monitorType){
				agent.notifyByType(msg.monitorType,moduleId,msg);
			}else{
				agent.notifyAll(moduleId,msg);
			}
		}else if(handler == "push"){
			if(moduleId == "systemInfo"){
				self.refresh();
				cb(null,systemInfo);
			}else if(moduleId == "processInfo"){
				cb(null,processInfo);
			}
		}else if(handler == "collect"){
			if(moduleId == "systemInfo"){
				logger.info("consoleService collect data from monitor");
				//logger.info(systemInfo);
				//systemInfo.push(msg);
				var nodeId = msg.id;
				nodes[nodeId] = {};
				nodes[nodeId].systemInfo = msg.body;
				logger.info(msg.body);
			}else if(moduleId == "processInfo"){
				processInfo.push(msg);
			}
		}else{
			this._modules[moduleId][handler](msg, cb);
		}
	}else if(this._serverType == "monitor"){
		//logger.info(this._modules);
		//console.log(moduleId);
		//console.log(util.inspect(this._modules, true, null));
		this._modules[moduleId]['monitorHandler'](msg, cb);
	}
};

/**
 * 设置状态信息
 */
pro.set = function(key, value) {
};

/**
 * 获取状态信息
 */
pro.get = function(key) {
};

pro.refresh = function(){
	systemInfo = [];
	for(var node in nodes){
		systemInfo.push(nodes[node].systemInfo);
	}
}

exports.consoleService = consoleService;