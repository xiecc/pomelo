var utils = require('../../util/utils');
var pomelo = require('../../pomelo');
var logger = require('../../util/log/log').getLogger(__filename);

/**
 * Status service.
 * keep all connection infos in memory.
 * only one connection at the same time for each account. latest login will kick the old one off.
 *
 * @module
 */
var StatusService = module.exports;

/**
 * object contains uids.
 */
var uidMap = {};

/**
 * Add uid and serverId pair into status records
 * kick the old login if any.
 *
 * @param {Number} uid userId
 * @param {Stirng} serverId sid
 * @param {Function} cb callback function
 * @memberOf StatusService
 */
StatusService.addStatus = function(uid, sid, cb) {
	logger.debug('add satus:' + uid + ', ' + sid);
	var oldSid = uidMap[uid];

	function addNewStatus(err) {
		if(!err) {
			uidMap[uid] = sid;
		}
		utils.invokeCallback(cb, err);
	}

	if(!!oldSid) {
		kick(uid, oldSid, addNewStatus);
	} else {
		addNewStatus();
	}

};

/**
 * Remove status record by uid
 *
 * @param {Number} uid userId
 * @param {Function} cb(err) callback function
 * @memberOf StatusService
 */
StatusService.removeStatus = function(uid, cb) {
	delete uidMap[uid];

	utils.invokeCallback(cb);
};

/**
 * Query status by uid
 *
 * @param {String} uid user id
 * @param {Function} cb callback function
 * @memberOf StatusService
 */
StatusService.queryStatus = function(uid, cb) {
	utils.invokeCallback(cb, null, uidMap[uid]);
};

/**
 * Query status by uids
 *
 * @param {Array} uids list of uid
 * @param {Function} cb cb(err, result, missing) result:{sid:[uid]}, missing:[missingUid]
 * @memberOf StatusService
 */
StatusService.queryStatusBatch = function(uids, cb) {
	var result = {};
	var missing = [];

	var sid, list;
	for(var i=0, l=uids.length; i<l; i++) {
		sid = uidMap[uids[i]];
		if(!sid) {
			missing.push(uids[i]);
			continue;
		}

		list = result[sid];
		if(!list) {
			list = [];
			result[sid] = list;
		}
		list.push(uids[i]);
	}

	utils.invokeCallback(cb, null, result, missing);
};

/**
 * Kick the user offline.
 *
 * @param uid {String} user id
 * @param sid {String} server id
 * @param cb {Function} callback function
 */
var kick = function(uid, sid, cb) {
	logger.debug('try to kick off uid:' + uid + ', sid:' + sid);
	var proxy = pomelo.app.components.proxy.client;
	proxy.rpcInvoke(sid, {namespace: 'sys', service: 'sessionRemote', method: 'kick', args: [uid]}, function(err) {
		if(!!err) {
			logger.error('fail to kick user, uid:' + uid + ', sid:' + sid + ', err:' + err.stack);
		}
		utils.invokeCallback(cb, err);
	});
};
