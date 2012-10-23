var channelManager = require('./channelManager');

/**
 *Manager localChannel and push message.
 *
 * @module
 */
var ChannelService = module.exports;

/**
 * Get local channel instance.
 *
 * @param {Object} opts channel info parameters {name: channelName, create: createIfNotExist}
 * @memberOf ChannelService
 */
ChannelService.getLocalChannelSync = function(opts) {
  return channelManager.getChannel(opts.name, opts.create);
};

/**
 * Push message by uids.
 * Group the uids by group. query status server for sid if sid not specified.
 *
 * @param {Object} msg message that would be sent to client
 * @param {Array} uids [{uid: userId, sid: serverId}] or [uids]
 * @param {Function} cb cb(err)
 * @memberOf ChannelService
 */
ChannelService.pushMessageByUids = function(msg, uids, cb) {
  channelManager.pushMessageByUids(msg, uids, cb);
};

