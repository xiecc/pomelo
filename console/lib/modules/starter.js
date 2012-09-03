var utils = require('../util/utils');

var Starter = function(app, consoleService) {
	this.app = app;
	this.consoleService = consoleService;
	this.registered = {};
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

var onRegister = function(starter, serverId, serverType) {
	starter.registered[serverId] = 1;

	var list;
	for(var serverType in starter.servers) {
		list = starter.servers[serverType];
		for(var i=0, l=list.length; i<l; i++) {
			if(!starter.registered[list[i].id]) {
				return;
			}
		}
	} 

};