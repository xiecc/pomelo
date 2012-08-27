/*!
 * Pomelo -- masterAgent
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var io = require('socket.io');
var __ = require('underscore');
var logger = require('./util/log/log').getLogger(__filename);

var masterAgent = function(consoleService){
	this._consoleService = consoleService;
	this._clientById = {};
	this._clientByType = {};
}

var pro = masterAgent.prototype;

/**
 * 监听端口
 * 新连接的客户端需要完成register流程
 * 状态：
 * connected -> registered -> working -> closed
 * 注册结果：
 * client record: {serverId, serverType, socket, state(?)}
 * map1: serverId -> record
 * map2: serverType -> [record]
 */
pro.listen = function(port) {
	var self = this;
	var consoleService = self._consoleService;
	this.io = io.listen(port);
	console.log("master listen on port: "+port);
	this.io.sockets.on('connection',function(socket){

		socket.on('register',function(msg){
			console.log("-------register------");
			console.log(msg);
			self._clientById[msg.serverId] = socket;
			if(typeof self._clientByType[msg.serverType] == "undefined"){
				self._clientByType[msg.serverType] = [];
			}
			self._clientByType[msg.serverType].push(socket);
			//logger.info(self._clientById);
			socket.emit('working',{serverId:msg.serverId,serverType:msg.serverType});
		});

		var handler = "";
		socket.on('message',function(msg){	
			if(msg.serverType == "client"){
				if(msg.dataSource == "monitor"){
					// 向指定的 monitor 客户端发送请求
					handler = "request";
					consoleService.execute(self,msg.moduleId,handler,msg);
				}else if(msg.dataSource == "master"){
					// 把 master 中的 consoleService 里面的数据发给请求的 client
					handler = "push";
					consoleService.execute(self,msg.moduleId,handler,msg,function(err,result){
						socket.emit(msg.moduleId,result);
					});
				}
			}else if(msg.serverType == "monitor"){
				if(msg.dataSource == "monitor"){
					// 把 monitor 发回的数据发给 client
					// execute 一下，转给相应的 module 的 masterHandler 把数据经过封装后 cb 返回
					handler = "masterHandler";
					consoleService.execute(self,msg.moduleId,handler,msg,function(err,result){
						socket.emit(msg.moduleId,result);
					});
				}else if(msg.dataSource == "master"){
					// 收集从 monitor 返回来的数据
					handler = "collect";
					logger.info(handler);
					consoleService.execute(self,msg.moduleId,handler,msg);
				}
			}
		});
	});
};

/**
 * 关闭master
 */
pro.close = function(cb) {
};

/**
 * 向指定的monitor发送需要响应的消息
 */
pro.request = function(serverId, moduleId, msg, cb) {
	var socket = this._clientById(serverId);
	socket.emit("message",msg);
};

/**
 * 向指定的monitor发送不需要响应的消息
 */
pro.notifyById = function(serverId, moduleId, msg) {
	var socket = this._clientById(serverId);
	socket.emit("message",{moduleId:moduleId,body:msg}); 
};

/**
 * 向指定类型的monitor发送不需要响应的消息
 */
pro.notifyByType = function(serverType, moduleId, msg) {
	var sockets = this._clientByType(serverType);
	for(var socket in sockets){
		socket.emit("message",msg);
	}
};

/**
 * 向所有monitor发送不需要响应的消息
 */
pro.notifyAll = function(moduleId, msg) {
	for(var monitor in this._clientById){
		var socket = this._clientById[monitor];
		socket.emit("message",msg);
	}
};

// new register, disconnect, error等
/*
pro.on();
pro.emit();

*/
exports.masterAgent = masterAgent;