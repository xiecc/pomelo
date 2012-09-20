/**
 * Filter for rpc.
 * Record used time for remote process call.
 */
var monitorService = require('../common/service/monitorService');
var rpc_logger = require('../util/log/log').getLogger('rpc-log');

var exp = module.exports;

/**
 * Before filter for rpc
 */
exp.before = function(serverId, msg, opts, next) {
	opts = opts||{};
	opts.__start_time__ = Date.now();
	next(serverId, msg, opts);
};

/**
 * After filter for rpc
 */
exp.after = function(serverId, msg, opts, next) {
	if(!!opts && !!opts.__start_time__) {
		var start = opts.__start_time__;
		var end = Date.now();
		var timeUsed = end - start;
		var log = 'namespace:' + msg.namespace + ',service:' + msg.service + ',method:' + msg.method
			        + ',args:' + msg.args + ' ' + start + ' ' + timeUsed;
    rpc_logger.info(log);
    //rpc_logger.info([JSON.stringify(msg), start, timeUsed].join(' '));
		monitorService.addTime(msg.route, timeUsed);
	}
	next(serverId, msg, opts);
};


