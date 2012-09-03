/*!
 * Pomelo -- consoleModule nodeInfo processInfo
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);
var connectionService = require('../../../lib/common/service/connectionService');

var onlineUser = function(consoleService) {
	this.consoleService = consoleService;
};

module.exports = onlineUser;
var moduleId = "onlineUser";

var pro = onlineUser.prototype;
 
pro.monitorHandler = function(msg, cb) {
	//collect data
	var self = this;
	var serverId = self.consoleService.id;
	cb(null,{serverId:serverId,body:connectionService.getStatisticsInfo()});

};

pro.masterHandler = function(msg, cb) {
	var body=msg.body;
	this.consoleService.set(this.consoleService.get("totalConnCount")+body.totalConnCount);
	this.consoleService.set(this.consoleService.get("loginedCount")+body.loginedCount);
    
    var onlineUsers=body.loginedList;
    for(var i=0;i<onlineUsers.length;i++){
        onlineUsers[i].serverId=body.serverId;
        this.consoleService.getCollect("onlineUserList").push(onlineUsers[i]);
    }
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
		cb(null,{totalConnCount:this.consoleService.get("totalConnCount"),loginedCount:this.consoleService.get("loginedCount"),onlineUserList:this.consoleService.getCollect("onlineUserList")});
	}
};
