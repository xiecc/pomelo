var utils = require('../util/utils');

var Starter = function(app) {
	this.app = app;
};

module.exports = Starter;

var pro = Starter.prototype;

pro.monitorHandler = function(agent, msg, cb) {
	console.error('after start:%j', this.app.serverId);
	var self = this;
	this.app.afterStart(function(err) {
		if(err) {
			logger.error('fail to call afterStart lifecycle, now try to stop server. ' + err.stack);
			self.app.stop(true);
		}
	});
};
