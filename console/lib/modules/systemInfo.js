/*!
 * Pomelo -- consoleModule systemInfo
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);

var systemInfo = function(consoleService) {
	this._consoleService = consoleService;
};

var pro = systemInfo.prototype;

/**
 * monitor 端消息处理函数
 * 底层的收集数据，收集完之后，通过 cb 丢还给 master
 */
pro.monitorHandler = function(msg, cb) {
	//collect data
	monitor.sysmonitor.getSysInfo(function (data) {
		//logger.info(data);
        cb(null, data);
    });
};

/** 
 * master 端消息处理函数
 * 1:发回给 client 的数据在这里经过封装处理，通过 cb 返回
 */
pro.masterHandler = function(msg, cb) {
	//msg = do(msg);
	cb(err,msg);
};

/**
 * client 端消息处理函数
 * 这里传递进来一个 masterAgent 主要是考虑到 client 请求过来可能需要对相应的 monitor 进行广播
 * cb 则是封装了 socket 来进行把数据 pull 回来的过程
 */

pro.clientHandler = function(masterAgent, msg, cb) {
	//masterAgent.request(,msg,cb);
};

exports.systemInfo = systemInfo;