/**
 * Component for monitor.
 * Load and start monitor client.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var admin = require('pomelo-admin');
var starter = require('../master/starter');

var Monitor = function(app) {
	this.app = app;
	this.server = app.get('curServer');
	this.master = app.master;
	this.monitorConsole = admin.createMonitorConsole({
		id: this.server.id, 
		type: this.app.serverType, 
		host: this.master.host, 
		port: this.master.port
	});
};

module.exports = Monitor;

Monitor.prototype.start = function(cb) {
	registerDefaultModules(this.app);
	loadModules(this.app, this.monitorConsole);
	this.monitorConsole.start(cb);
};

Monitor.prototype.stop = function(cb) {
	this.monitorConsole.stop();
	process.nextTick(function() {
		cb();
	});
};

/**
 * Load admin modules
 */
var loadModules = function(app, consoleService) {
	// load app register modules 
	var modules = app.get('__modules__');

	if(!modules) {
		return;
	}

	var record, moduleId, module;
	for(var i=0, l=modules.length; i<l; i++){
		record = modules[i];
		if(typeof record.module === 'function') {
			module = record.module(record.opts);
		} else {
			module = record.module;
		}

		moduleId = record.moduleId || module.moduleId;

		if(!moduleId) {
			logger.warn('ignore an uname module.');
			continue;
		}

		consoleService.register(moduleId, module);	
	}
};

/**
 * Append the default system admin modules
 */
var registerDefaultModules = function(app) {
	app.registerAdmin(require('../modules/afterStart'), app);
	app.registerAdmin(admin.modules.systemInfo);
	app.registerAdmin(admin.modules.nodeInfo);
	app.registerAdmin(admin.modules.monitorLog);
	app.registerAdmin(admin.modules.scripts, app);
	app.registerAdmin(admin.modules.profiler);
	app.registerAdmin(require('../modules/stop'), {app: app, starter: starter});
};
