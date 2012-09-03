/*!
 * Pomelo -- consoleModule nodeInfo processInfo
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);

var nodeInfo = function(consoleService) {
	this.consoleService = consoleService;
};

module.exports = nodeInfo;
var moduleId = "nodeInfo";

var pro = nodeInfo.prototype;
 
pro.monitorHandler = function(msg, cb) {
	//collect data
	var self = this;
	var serverId = self.consoleService.id;
	var pid = process.pid;
	var params = {
		serverId: serverId,
		pid: pid
	};
    monitor.psmonitor.getPsInfo(params, function (data) {
        cb(null, {serverId:serverId,body:data});
    });

};

pro.masterHandler = function(msg, cb) {
	var body=msg.body;
	this.consoleService.set(moduleId,msg.serverId,body);
	if(typeof cb != "undefined"){
		cb(null,body);
	}
};

pro.clientHandler = function(agent,msg, cb) {

	if(msg.monitorId){
		// request from client get data from monitor
		agent.request(msg.monitorId,moduleId,msg,function(err,resp){
			cb(err,resp);
		});
	}else{
		cb(null,this.consoleService.get(moduleId));
	}
};
