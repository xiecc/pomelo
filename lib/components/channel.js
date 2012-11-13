var ChannelService = require('../common/service/channelService');

module.exports = function(app) {
	var service = new ChannelService(app);
	app.set('channelService', service);
	service.name = '__channel__';
	return service;
};