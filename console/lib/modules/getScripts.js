/*!
 * Pomelo -- consoleModule getScripts 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);
var ms = require('../util/monitorScript');

var getScripts = function(consoleService) {
	this.consoleService = consoleService;
};

module.exports = getScripts;
var moduleId = "getScripts";

var pro = getScripts.prototype;
 
pro.monitorHandler = function(agent,msg, cb) {

};

pro.masterHandler = function(agent,msg, cb) {
	var body=msg.body;
	this.consoleService.set(moduleId,body,msg.serverId);
	if(typeof cb != "undefined"){
		cb(null,body);
	}
};

pro.clientHandler = function(agent,msg, cb) {
	var nodes = this.consoleService
	var self = this;
	if(msg.monitorId){
		// request from client get data from monitor
		agent.request(msg.monitorId,moduleId,msg,function(err,resp){
			cb(err,resp);
		});
	}else{
		var serverArray=[];
        var scriptArray=[];
        for(var nodeId in nodes){
            serverArray.push({name:nodeId,serverId:nodeId});
        }
        ms.readDir(function(filenames){
            for(var i=0;i<filenames.length;i++){
                scriptArray.push({name:filenames[i],script:filenames[i]});
            }
            cb(null,{serverArray:serverArray,scriptArray:scriptArray});
        });
	}
};
