/**
 * Component for monitor.
 * Load and start monitor client.
 */
//var logger = require('../util/log/log').getLogger(__filename);
//var utils = require('../util/utils');

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @return {Object}      component instances
 */
/**
module.exports = function(app) {
  return new Monitor(app);
};

 **/
var monitor = require('../../console');
var ConsoleService = monitor.consoleService;
var Starter = require('../monitor/starter');
var utils = require('../util/utils');

module.exports = function(app) {
	return new Monitor(app);
};

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