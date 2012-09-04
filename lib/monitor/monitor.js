var monitor = require('../../console');
var ConsoleService = monitor.consoleService;
var Starter = monitor.starter;
var utils = require('../util/utils');

var Monitor = function(app) {
	this.server = app.findServer(app.serverType, app.serverId);
	this.master = app.master;
	this.monitorConsole = new ConsoleService({
		id: this.server.id, 
		type: app.serverType, 
		host: this.master.host, 
		port: this.master.port
	});
	this.monitorConsole.register('__starter__', new Starter(app));
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