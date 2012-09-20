/**
 * Component for monitor.
 * Load and start monitor client.
 */
var logger = require('../util/log/log').getLogger(__filename);
var monitor = require('../../console');
var Starter = require('../modules/starter');
var utils = require('../util/utils');

var Monitor = function(app) {
	this.app = app;
	this.server = app.curserver;
	this.master = app.master;

	this._loadModules();
};

module.exports = Monitor;

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

pro._loadModules = function() {
	this.monitorConsole = monitor.createMonitorConsole({
		id: this.server.id, 
		type: this.app.serverType, 
		host: this.master.host, 
		port: this.master.port
	});

	this.monitorConsole.register(Starter.moduleId, new Starter(this.app));

	// TODO: load monitor.modules automatically
	var SystemInfo = monitor.modules.systemInfo;
	this.monitorConsole.register(SystemInfo.moduleId, new SystemInfo());

	var OnlineUser = monitor.modules.onlineUser;
	this.monitorConsole.register(OnlineUser.moduleId, new OnlineUser(this.app));

	var Scripts = monitor.modules.scripts;
	this.monitorConsole.register(Scripts.moduleId, new Scripts(this.app));

	var Profiler = monitor.modules.profiler;
	this.monitorConsole.register(Profiler.moduleId, new Profiler(this.app));
};