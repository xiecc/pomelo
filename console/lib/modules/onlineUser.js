/*!
 * Pomelo -- consoleModule onlineUser 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);
var utils = require('../util/utils');
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
	utils.invokeCallback(cb,null,{serverId:serverId,body:connectionService.getStatisticsInfo()});
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
	if(msg&&msg.reqId){
		utils.invokeCallback(cb,null,body);
	}
};

pro.clientHandler = function(agent,msg, cb) {
	if(msg.monitorId != 'all'){
		// request from client get data from monitor
		agent.request(msg.monitorId,moduleId,msg,function(err,resp){
			utils.invokeCallback(cb,err,resp);
		});
	}else{
		// 这里的数据应该也是要从 monitor 中推送过来的
		//agent.notifyAll(moduleId,msg);
		utils.invokeCallback(cb,null,{totalConnCount:(this.consoleService.get("totalConnCount")||0),loginedCount:(this.consoleService.get("loginedCount")||0),onlineUserList:(this.consoleService.get("onlineUserList")||{})})
	}
};
