/*!
 * Pomelo -- consoleModule runScript 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);
var utils = require('../util/utils');
var monitor = require('pomelo-monitor');
var ml = require('../util/monitorLog');
var vm = require('vm');

var getScripts = function(consoleService) {
	this.consoleService = consoleService;
};

module.exports = getScripts;
var moduleId = "getScripts";

var pro = getScripts.prototype;
 
pro.monitorHandler = function(agent,msg, cb) {
	var initContext = {
        app:this.consoleService.agent,
        os:require('os'),
        fs:require('fs'),
        process:process,
        monitor:monitor,
      	logger:logger,
        monitorLog:ml
    };
    var serverId = this.consoleService.id;
    var context = vm.createContext(initContext);
    var result = vm.runInContext(msg, context);
    utils.invokeCallback(cb,null,result);
};

pro.masterHandler = function(agent,msg, cb) {
	
};

pro.clientHandler = function(agent,msg, cb) {
	var nodes = this.consoleService
	var self = this;
	if(msg.monitorId != 'all'){
		// request from client get data from monitor
		agent.request(msg.monitorId,moduleId,msg,function(err,resp){
			utils.invokeCallback(cb,err,resp);
		});
	}
};
