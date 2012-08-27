/*!
 * Pomelo -- monitorAgent
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */

 var io = require('socket.io-client');
 var logger = require('./util/log/log').getLogger(__filename);

 /**
 * 构造MonitorAgent实例，注入server id, server type等信息 
 */
var monitorAgent = function(consoleService) {
	this._consoleService = consoleService;
	this._serverId = consoleService['_serverId'];
	this._serverType = consoleService['_serverType'];
};

var pro = monitorAgent.prototype;

var STATUS_INTERVAL = 5 * 1000; // 60 seconds
/**
 * 连接到master服务器，并完成注册流程。结果通过cb通知
 */
pro.connect = function(host,port,cb) {
	var self = this;
	var socket = this._socket = io.connect(host+":"+port);
	console.log("monitor listen on "+host+":"+port);
	var consoleService = this._consoleService;
	socket.on('connect',function(){
		socket.emit('register',{serverId:self._serverId,serverType:self._serverType});
	});

	socket.on('working',function(msg){
		logger.info(msg + "connect to master");
	});

	socket.on('message', function(msg) {
		consoleService.execute(self,msg.moduleId,"pull",msg.body, function(err, res) {
			if(data.id) {
				//通过回调丢给master
				socket.emit('message', {id: data.id, body: res});
			} else {
				socket.emit('message', {moduleId: data.moduleId, body: res});
			}
		});
	});
	
	//interval push
	logger.info("interval push");
	setInterval(function() {
		consoleService.execute(self,"systemInfo","push","",function(err, res) {
			socket.emit('message', {id:consoleService._serverId,serverType:"monitor",dataSource:"master",moduleId: "systemInfo", body: res});
		});
	}, STATUS_INTERVAL);

	/*
	setInterval(function(){
		consoleService.execute(self,"processInfo","push","",function(err, res) {
			socket.emit('message', {serverType:"monitor",dataSource:"master",moduleId: "processInfo", body: res});
		});
	},STATUS_INTERVAL);
	*/
};

/**
 * 关闭monitor
 */
pro.close = function(cb) {
};

// disconnect, error等
/*
pro.on();
pro.emit();
*/
exports.monitorAgent = monitorAgent;