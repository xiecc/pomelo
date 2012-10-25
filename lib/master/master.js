var starter = require('../master/starter');
var logger = require('pomelo-logger').getLogger(__filename);
var crashLogger = require('pomelo-logger').getLogger('crash-log');
var admin = require('pomelo-admin');
var Starter = require('../modules/starter');
var util = require('util');

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

	this._loadModules();
};

module.exports = Server;

var pro = Server.prototype;

/**
 * Load admin modules
 *
 * @api private
 */
pro._loadModules = function() {
	// load admin modules
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
	this.masterConsole.register(Scripts.moduleId, new Scripts(this.app));

	var Profiler = admin.modules.profiler;
	this.masterConsole.register(Profiler.moduleId, new Profiler(this.app, true, this.masterConsole.agent));

	var ServerStop = admin.modules.serverStop;
	this.masterConsole.register(ServerStop.moduleId, new ServerStop(this.app));

	// load app register modules 
	var _modules = this.app.modules;
	for(var _module in _modules){
		var fun = _modules[_module];
		this.masterConsole.register(_module,fun);	
	}
};

pro.start = function(cb) {
	var self = this;
	this.masterConsole.start(function(err) {
		if(err) {
			cb(err);
			return;
		}
		starter.runServers(self.app);
		cb();
	});
	
	this.masterConsole.on('register', function(record) {
		logger.debug('[master] new register connection: %j, %j', record.id, record.type);
		self.registered[record.id] = record;
		if(checkRegistered(self)) {
			logger.info('[master] all servers have started and notify after start now...');
			self.masterConsole.agent.notifyAll(Starter.moduleId);
		}
	});

	this.masterConsole.on('disconnect', function(id, type, reason) {
		crashLogger.info(util.format('[%s],[%s],[%s],[%s]', type,id,Date.now(), reason || 'disconnect'));
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


