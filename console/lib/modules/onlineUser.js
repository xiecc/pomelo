/*!
 * Pomelo -- consoleModule onlineUser 
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
 
pro.monitorHandler = function(agent,msg, cb) {
	//collect data
	var self = this;
	var serverId = self.consoleService.id;
	cb(null,{serverId:serverId,body:connectionService.getStatisticsInfo()});

};

pro.masterHandler = function(agent,msg, cb) {
	var body=msg.body;
	this.consoleService.set("totalConnCount",(this.consoleService.get("totalConnCount") || 0)+body.totalConnCount);
	this.consoleService.set("loginedCount",(this.consoleService.get("loginedCount") || 0)+body.loginedCount);
    
    var onlineUsers=body.loginedList;
    for(var i=0;i<onlineUsers.length;i++){
        //onlineUsers[i].serverId=body.serverId;
        this.consoleService.set(monitorId,onlineUsers[i],body.serverId);
        //this.consoleService.getCollect("onlineUserList").push(onlineUsers[i]);
    }
	if(typeof cb != "undefined"){
		cb(null,body);
	}
};

pro.clientHandler = function(agent,msg, cb) {
	if(msg.monitorId){
		// request from client get data from monitor
		if(msg.monitorId != 'master'){
			agent.request(msg.monitorId,moduleId,msg,function(err,resp){
				cb(err,resp);
			});
		}else{
			self.monitorHandler(agent,msg,function(err,result){
				cb(err,result);
			})
		}
	}else{
		// 这里的数据应该也是要从 monitor 中推送过来的
		//agent.notifyAll(moduleId,msg);
		cb(null,{totalConnCount:(this.consoleService.get("totalConnCount")||0),loginedCount:(this.consoleService.get("loginedCount")||0),onlineUserList:(this.consoleService.get("onlineUserList")||{})});
	}
};
