var pomelo = require('../../pomelo');

/**
 * connection statistics service
 * record connection, login count and list
 */
var Service = function() {
	this.connCount = 0;
	thisloginedCount = 0;
	this.logined = {};
};

module.exports = Service;

var pro = Service.prototype;

/**
 * Add logined user.
 *
 * @param uid {String} user id
 * @param info {Object} record for logined user
 */
pro.addLoginedUser = function(uid, info) {
	if(!logined[uid]) {
		loginedCount++;
	}
	logined[uid] = info;
};

/**
 * Increase connection count
 */
pro.increaseConnectionCount = function() {
	connCount++;
};

/**
 * Remote logined user
 *
 * @param uid {String} user id
 */
pro.removeLoginedUser = function(uid) {
	if(!!logined[uid]) {
		loginedCount--;
	}
	delete logined[uid];
};

/**
 * Decrease connection count
 *
 * @param uid {String} uid
 */
pro.decreaseConnectionCount = function(uid) {
	connCount--;
	if(!!uid) {
		exp.removeLoginedUser(uid);
	}
};

/**
 * Get statistics info
 *
 * @return {Object} statistics info
 */
pro.getStatisticsInfo = function() {
	var list = [];
	for(var uid in logined) {
		list.push(logined[uid]);
	}

	return {serverId: pomelo.app.serverId, totalConnCount: connCount, loginedCount: loginedCount, loginedList: list};
};
