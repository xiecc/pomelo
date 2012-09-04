var utils = require('../util/utils');

var Starter = function(app) {
	this.app = app;
};

var pro = Starter.prototype;

pro.monitorHandler = function(msg, cb) {
	var self = this;
	this.app.afterStart(function(err) {
		if(err) {
			logger.error('fail to call afterStart lifecycle, now try to stop server. ' + err.stack);
			self.app.stop(true);
		}
	});
};
