/*!
 * Pomelo -- consoleModule onlineUser 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);
var utils = require('../util/utils');

var Module = function(app, opts) {
	this.app = app;
	this.type = opts.type || 'pull';
	this.interval = opts.interval || 30;
};

Module.moduleId = 'onlineUser';

var pro = Module.prototype;

pro.monitorHandler = function(agent, msg) {
	var connectionService = this.app.components.connection;
	if(!connectionService) {
		logger.error('not support connection.');
		return;
	}

	agent.notify(Module.moduleId, 
		{serverId: agent.id, body: connectionService.getStatisticsInfo()}
	);
};

pro.masterHandler = function(agent, msg) {
	if(!msg) {
		// pull interval callback
		agent.notifyAll(Module.moduleId);
		return;
	}

	var body = msg.body;
	var data = agent.get(Module.moduleId);
	if(!data) {
		data = {};
		agent.set(ModuleId.moduleId);
	}

	data[msg.id] = msg.body;
};

pro.clientHandler = function(agent, msg, cb) {
	utils.invokeCallback(cb, null, agent.get(Module.moduleId));
	/*
	utils.invokeCallback(cb, null, {
		totalConnCount: (this.consoleService.get("totalConnCount")||0), 
		loginedCount:(this.consoleService.get("loginedCount")||0), 
		onlineUserList:(this.consoleService.get("onlineUserList")||{})
	});*/
};
