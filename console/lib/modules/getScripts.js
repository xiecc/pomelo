/*!
 * Pomelo -- consoleModule getScripts 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);
var ms = require('../util/monitorScript');
var utils = require('../util/utils');

var getScripts = function(consoleService) {
	this.consoleService = consoleService;
};

module.exports = getScripts;
var moduleId = "getScripts";

var pro = getScripts.prototype;
 
pro.monitorHandler = function(agent,msg, cb) {

};

pro.masterHandler = function(agent,msg, cb) {

};

pro.clientHandler = function(agent,msg, cb) {
	var self = this;
	var serverArray=[];
    var scriptArray=[];
    for(var nodeId in nodes){
        serverArray.push({name:nodeId,serverId:nodeId});
    }
    ms.readDir(function(filenames){
        for(var i=0;i<filenames.length;i++){
            scriptArray.push({name:filenames[i],script:filenames[i]});
        }
        utils.invokeCallback(cb, null, {serverArray:serverArray,scriptArray:scriptArray});
    });
};
