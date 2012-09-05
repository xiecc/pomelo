/*!
 * Pomelo -- consoleModule systemInfo
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);

var systemInfo = function(consoleService) {
	this.consoleService = consoleService;
};

module.exports = systemInfo;
var moduleId = "systemInfo";

var pro = systemInfo.prototype;
 
pro.monitorHandler = function(agent,msg, cb) {
	//collect data
	var self = this;
	monitor.sysmonitor.getSysInfo(function (data) {
        cb(null, {serverId:self.consoleService.id,body:data});
    });
};

pro.masterHandler = function(agent,msg, cb) {

	var body=msg.body;
    var wholeMsg={
        system:body.hostname+','+body.type+','+body.arch+''+body.release+','+body.uptime,
        cpu:JSON.stringify(body.cpus[0])+';'+JSON.stringify(body.cpus[1]),
        start_time:body.iostat.date
    };
    var oneData={
    	Time:body.iostat.date,hostname:body.hostname,serverId:msg.serverId,cpu_user:body.iostat.cpu.cpu_user,
        cpu_nice:body.iostat.cpu.cpu_nice,cpu_system:body.iostat.cpu.cpu_system,cpu_iowait:body.iostat.cpu.cpu_iowait,
        cpu_steal:body.iostat.cpu.cpu_steal,cpu_idle:body.iostat.cpu.cpu_idle,tps:body.iostat.disk.tps,
        kb_read:body.iostat.disk.kb_read,kb_wrtn:body.iostat.disk.kb_wrtn,kb_read_per:body.iostat.disk.kb_read_per,
        kb_wrtn_per:body.iostat.disk.kb_wrtn_per,totalmem:body.totalmem,freemem:body.freemem,'free/total':(body.freemem/body.totalmem),
        m_1:body.loadavg[0],m_5:body.loadavg[1],m_15:body.loadavg[2]
    };

    // data interval pushed from monitor
	this.consoleService.set(moduleId,oneData,msg.serverId);
	/*
	// master itself data
	this.monitorHandler(agent,msg,function(err,result){
		this.consoleService.set(moduleId,oneData,msg.serverId);
	});
	*/
	// request should have a cb
	// notify should not have a cb
	if(msg&&msg.reqId){
		cb(null,oneData);
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
		cb(null,this.consoleService.get(moduleId) || {});
	}
};
