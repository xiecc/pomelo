/**
 * Component for monitor.
 * Load and start monitor client.
 */
var logger = require('../util/log/log').getLogger(__filename);
var monitor = require('../../console');
var Starter = require('../monitor/starter');
var utils = require('../util/utils');

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @return {Object}      component instances
 */
module.exports = function(app) {
	return new Monitor(app);
};

var Monitor = function(app) {
	this.server = app.findServer(app.serverType, app.serverId);
	this.master = app.master;
	this.monitorConsole = monitor.createMonitorConsole({
		id: this.server.id, 
		type: app.serverType, 
		host: this.master.host, 
		port: this.master.port
	});
	this.monitorConsole.register('__starter__', new Starter(app));
	var SystemInfo = monitor.modules.systemInfo;
	this.monitorConsole.register(SystemInfo.moduleId, new SystemInfo());
};

var pro = Monitor.prototype;

pro.start = function(cb) {
	this.monitorConsole.start(cb);
};

pro.stop = function(cb) {
	this.monitorConsole.stop();
	process.nextTick(function() {
		utils.invokeCallback(cb);
	});
};

pro.name = '__monitor__';
