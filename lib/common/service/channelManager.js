var pomelo = require('../../pomelo');
var countDownLatch = require('../../util/countDownLatch');
var utils = require('../../util/utils');
var logger = require('../../util/log/log').getLogger(__filename);
var async = require('async');
var __ = require('underscore');

var exp = module.exports;

var DEFAULT_GROUP_ID = 'default';

var channels = {};

var Channel = function(name) {
	this.groups = {};			//group map for uids. key: sid, value: [uid]
	this.defaultGroup = [];		//default group for uids that not specified sid
};

var pro = Channel.prototype;

/**
 * add user to channel
 *
 * @param uid user id
 * @param sid frontend server id which user has connected to
 */
pro.add = function(uid, sid, cb) {
  var err = null;
  if(!!this._destroy) {
    err = new Error('channel ' + this.name + ' has been destroyed');
  } else {
    add(uid, sid, this.groups, this.defaultGroup);
  }

  process.nextTick(function() {
    utils.invokeCallback(cb, err);
  });
};

/**
 * remove user from channel
 *
 * @param uid user id
 * @param sid frontend server id which user has connected to. remove uid for all groups if sid not specified.
 * @return [Boolean] true if success or false if fail
 */
pro.leave = function(uid, sid, cb) {
	if(!sid) {
		removeUid(uid, this.groups, this.defaultGroup);
	} else {
    deleteFrom(uid, sid, this.groups[sid]);
  }

  process.nextTick(function() {
    utils.invokeCallback(cb);
  });
};

/**
 * destroy channel
 */
pro.destroy = function(force, cb) {
  this.__destroy = true;
  exp.destroyChannel(this.name, force);

  process.nextTick(function() {
    utils.invokeCallback(cb);
  });
};

/**
 * push message to all the members in the channel
 *
 * @param msg {Object} message that would be sent to client
 * @param cb {Functioin} cb(err)
 */
pro.pushMessage = function(msg, cb) {
	var self = this;
	regroup(this.groups, this.defaultGroup, function(err, miss) {
		if(!!err) {
			utils.invokeCallback(cb, err);
			return;
		}

		if(__.size(self.groups) === 0) {
			utils.invokeCallback();
			return;
		}
		sendMessageByGroup(msg, self.groups, cb);
	});
};

/**
 * create channel with name
 */
exp.createChannel = function(name) {
	if(!!channels[name]) {
		return channels[name];
	}

	var c = new Channel(name);
	channels[name] = c;
	return c;
};

/**
 * get channel by name
 */
exp.getChannel = function(name, create) {
  var channel = channels[name];
  if(!channel && !!create) {
    channel = channels[name] = new Channel(name);
  }
	return channel;
};

/**
 * destroy channel
 */
exp.destroyChannel = function(name, force) {
  delete channels[name];
};

/**
 * push message by uids
 * group the uids by group. query status server for sid if sid not specified.
 *
 * @param msg {Object} message that would be sent to client
 * @param uids {Array} [{uid: userId, sid: serverId}] or [uids]
 * @param cb {Function} cb(err)
 */
exp.pushMessageByUids = function(msg, uids, cb) {
	if(!uids || uids.length === 0) {
		utils.invokeCallback(cb, new Error('uids should not be empty'));
		return;
	}
	var groups = {}, defGroup = [];
	for(var i=0, l=uids.length; i<l; i++) {
		if(!!uids[i].uid) {
			add(uids[i].uid, uids[i].sid, groups, defGroup);
		} else {
			add(uids[i], null, groups, defGroup);
		}
	}

	regroup(groups, defGroup, function(err, miss) {
		if(!!err) {
			utils.invokeCallback(cb, err);
			return;
		}

		if(__.size(groups) === 0) {
			logger.warn('[pushMessage] group is empty.');
			utils.invokeCallback(null);
			return;
		}
		sendMessageByGroup(msg, groups, cb);
	});
};

/**
 * query connection status of the ungroup uids from status server and then merge them into groups
 *
 * @param groups [Object] grouped uids, key: sid, value: [uid]
 * @param defGroup [Array] ungroup uids
 * @param cb [Function] cb(err, miss). miss: array of miss uids
 */
var regroup = function(groups, defGroup, cb) {
	if(defGroup.length === 0) {
		utils.invokeCallback(cb);
		return;
	}

	var app = pomelo.app;
	app.rpc.status.statusRemote.queryStatusBatch(null, defGroup, function(err, res, miss) {
		if(!!err) {
			logger.error('fail to query status, err:' + err.stack);
			utils.invokeCallback(cb, err);
			return;
		}

		var i, l;
		if(res) {
			var uids, uid;
			for(var sid in res) {
				uids = res[sid];
				for(i=0, l=uids.length; i<l; i++) {
					uid = uids[i];
					add(uid, sid, groups, defGroup);
				}
			}
		}

		defGroup.length = 0;
		if(miss && miss.length > 0) {
			logger.warn('fail to group uids:' + miss);
			// keep the miss uids
			for(i=0, l=miss.length; i<l; i++) {
				defGroup.push(miss[i]);
			}
		}

		utils.invokeCallback(cb, null, miss);
	});	//end of proxy
};

/**
 * add uid and sid into group. add the uid into defGroup if the sid not specified
 *
 * @param uid user id
 * @param sid server id
 * @param groups {Object} grouped uids, , key: sid, value: [uid]
 * @param defGroup {Array} ungroup uids
 */
var add = function(uid, sid, groups, defGroup) {
	if(!sid) {
		defGroup.push(uid);
		return true;
	}

	var group = groups[sid];
	if(!group) {
		group = [];
		groups[sid] = group;
	}

	group.push(uid);
	return true;
};

/**
 * delete element from array
 */
var deleteFrom = function(uid, sid, group) {
	for(var i=0, l=group.length; i<l; i++) {
		if(group[i] === uid) {
			group.splice(i, 1);
			return true;
		}
	}

  return false;
};

/**
 * push message by group
 *
 * @param msg {Object} message that would be sent to client
 * @param groups {Object} grouped uids, , key: sid, value: [uid]
 * @param cb {Function} cb(err)
 */
var sendMessageByGroup = function(msg, groups, cb) {
	var app = pomelo.app;
	var rpcClient = app.components.proxy.client;
	var namespace = 'sys';
	var service = 'channelRemote';
	var method = 'pushMessage';
	var count = 0;
	var successFlag = false;
  msg = JSON.stringify(msg);
	for(var sid in groups) {
		count++;
    var uids = groups[sid];
    rpcClient.rpcInvoke(sid, {namespace: namespace, service: service, method: method, args: [msg, uids]}, function(err) {
      if(!!err) {
        logger.error('[pushMessage] fail to dispatch msg, serverId, err:' + err.stack);
        latch.done();
        return;
      }
      successFlag = true;
      latch.done();
    });
	}
	var latch = countDownLatch.createCountDownLatch(count, function(){
		if(!successFlag) {
			utils.invokeCallback(cb, new Error('all uids push message fail'));
			return;
		}
		utils.invokeCallback(cb);
	});
}; 

/**
 * remove uid from all groups
 */
var removeUid = function(uid, groups, defGroup) {
  if(deleteFrom(uid, DEFAULT_GROUP_ID, defGroup)) {
    return;
  }
  for(var sid in groups) {
    if(deleteFrom(uid, sid, groups[sid])) {
      return;
    }
  }
};
