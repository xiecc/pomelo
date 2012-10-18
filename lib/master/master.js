var pomelo = require('../pomelo');
var starter = require('../master/starter');
var logger = require('../util/log/log').getLogger(__filename);
var utils = require('../util/utils');
var admin = require('pomelo-admin');
var Starter = require('../modules/starter');
var crashLogger = require('../util/log/log').getLogger('crash-log');
var util = require('util');

var TIME_WAIT_KILL = 5000;

/**
 * master server
 */
var server = {};//module.exports;
var dserver;
var handler = {};

var Server = function(app) {
	this.app = app;
	this.server = app.master;
	this.registered = {};

	this.masterConsole = admin.createMasterConsole({
		port: this.server.port
	});

	// TODO: load admin.modules automatically
	var SystemInfo = admin.modules.systemInfo;
	this.masterConsole.register(SystemInfo.moduleId, new SystemInfo());

	var NodeInfo = admin.modules.nodeInfo;
	this.masterConsole.register(NodeInfo.moduleId, new NodeInfo());

	var MonitorLog = admin.modules.monitorLog;
	this.masterConsole.register(MonitorLog.moduleId, new MonitorLog());

	var Scripts = admin.modules.scripts;
	this.masterConsole.register(Scripts.moduleId, new Scripts(app));

	var Profiler = admin.modules.profiler;
	this.masterConsole.register(Profiler.moduleId, new Profiler(app, true, this.masterConsole.agent));

	var ServerStop = admin.modules.serverStop;
	this.masterConsole.register(ServerStop.moduleId, new ServerStop(app));

	// load app register modules 
	var _modules = app.modules;
	for(var _module in _modules){
		var fun = _modules[_module];
		this.masterConsole.register(_module,fun);	
	}
};

module.exports = Server;

var pro = Server.prototype;

pro.start = function(cb) {
	var self = this;
	this.masterConsole.start(function(err) {
		if(err) {
			utils.invokeCallback(cb, err);
			return;
		}
		runServers(self.app);
		utils.invokeCallback(cb);
	});
	
	this.masterConsole.on('register', function(record) {
		logger.debug('[master] new register connection: %j, %j', record.id, record.type);
		self.registered[record.id] = record;
		if(checkRegistered(self)) {
			logger.info('[master] all servers have started and notify after start now...');
			self.masterConsole.agent.notifyAll(Starter.moduleId);
		}
	});

	this.masterConsole.on('disconnect', function(id,type,reason) {
		crashLogger.info(util.format('[%s],[%s],[%s],[%s]', type,id,Date.now(), reason | 'disconnect'));
	});
};

pro.stop = function(cb) {
	this.masterConsole.stop(cb);
};

var checkRegistered = function(master) {
	var servers = master.app.servers, slist, i, l;
	for(var stype in servers) {
		slist = servers[stype];
		for(i=0, l=slist.length; i<l; i++) {
			if(!master.registered[slist[i].id]) {
				return false;
			}
		}
	}
	return true;
};

/**
 * Run all servers
 *
 * @param {Object} app current application  context
 * @return {Void}
 */
var runServers = function (app) {
	var servers = app.servers;
	for (var serverType in servers) {
		var typeServers = servers[serverType];
		for (var i = 0; i < typeServers.length; i++) {
			var curServer = typeServers[i];
			curServer.serverType = serverType;
			starter.run(app, curServer);
		}
	}
};

