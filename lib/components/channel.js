var ChannelService = require('../common/service/channelService');

/**
 * Component for channel service.
 *
 * @module
 */
module.exports = function(app) {
	return new Component(app);
};

var Component = function(app) {
	this.service = new ChannelService(app);
};

/**
 * Get channel instance.
 *
 * @param {Object} opts channel info parameters {name: channelName, create: createIfNotExist}
 * @memberOf ChannelService
 */
Component.prototype.getChannel = function(opts) {
  return this.service.getChannel(opts.name, opts.create);
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
Component.prototype.pushMessageByUids = function(msg, uids, cb) {
  this.service.pushMessageByUids(msg, uids, cb);
};