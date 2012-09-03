var should = require('should');
var flow = require('flow');
var Master = require('../lib/masterAgent');
var Monitor = require('../lib/monitorAgent');
var ConsoleService = require('../lib/consoleService');

var WAIT_TIME = 100;

var masterHost = '127.0.0.1';
var masterPort = 3333;

describe('console service', function() {
	it('should forward message from master to the monitorHandler method of the module of the right monitor, and get the response by masterAgent.request', function(done) {
		var monitorId1 = 'connector-server-1';
		var monitorId2 = 'area-server-1';
		var monitorType1 = 'connector';
		var monitorType2 = 'area';
		var moduleId1 = 'testModuleId1';
		var moduleId2 = 'testModuleId2';
		var msg1 = {msg: 'message to monitor1'};
		var msg2 = {msg: 'message to monitor2'};

		var req1Count = 0;
		var req2Count = 0;
		var resp1Count = 0;
		var resp2Count = 0;

		var masterConsole = new ConsoleService({
			type: 'master', 
			port: masterPort
		});

		var monitorConsole1 = new ConsoleService({
			host: masterHost, 
			port: masterPort, 
			id: monitorId1, 
			type: monitorType1
		});

		monitorConsole1.register(moduleId1, {
			monitorHandler: function(msg, cb) {
				req1Count++;
				should.exist(msg);
				msg.should.eql(msg1);
				cb(null, msg);
			}
		});

		var monitorConsole2 = new ConsoleService({
			host: masterHost, 
			port: masterPort, 
			id: monitorId2, 
			type: monitorType2
		});

		monitorConsole2.register(moduleId2, {
			monitorHandler: function(msg, cb) {
				req2Count++;
				should.exist(msg);
				msg.should.eql(msg2);
				cb(null, msg);
			}
		});

		flow.exec(function() {
			masterConsole.start(this);
		}, 
		function(err) {
			should.not.exist(err);
			monitorConsole1.start(this);
		}, 
		function(err) {
			should.not.exist(err);
			monitorConsole2.start(this);
		}, 
		function(err) {
			should.not.exist(err);
			masterConsole.agent.request(monitorId1, moduleId1, msg1, function(err, resp) {
				resp1Count++;
				should.not.exist(err);
				should.exist(resp);
				resp.should.eql(msg1);
			});

			masterConsole.agent.request(monitorId2, moduleId2, msg2, function(err, resp) {
				resp2Count++;
				should.not.exist(err);
				should.exist(resp);
				resp.should.eql(msg2);
			});
		});		// end of flow.exec

		setTimeout(function() {
			req1Count.should.equal(1);
			req2Count.should.equal(1);
			resp1Count.should.equal(1);
			resp2Count.should.equal(1);

			monitorConsole1.stop();
			monitorConsole2.stop();
			masterConsole.stop();
			done();
		}, WAIT_TIME);
	});

	it('should forward message from monitor to the masterHandler of the right module of the master by monitor.notify', function(done) {
		var monitorId = 'connector-server-1';
		var monitorType = 'connector';
		var moduleId = 'testModuleId';
		var orgMsg = {msg: 'message to master'};

		var reqCount = 0;

		var masterConsole = new ConsoleService({
			type: 'master', 
			port: masterPort
		});

		masterConsole.register(moduleId, {
			masterHandler: function(msg, cb) {
				reqCount++;
				should.exist(msg);
				msg.should.eql(orgMsg);
			}
		});

		var monitorConsole = new ConsoleService({
			host: masterHost, 
			port: masterPort, 
			id: monitorId, 
			type: monitorType
		});

		flow.exec(function() {
			masterConsole.start(this);
		}, 
		function(err) {
			should.not.exist(err);
			monitorConsole.start(this);
		}, 
		function(err) {
			should.not.exist(err);
			monitorConsole.agent.notify(moduleId, orgMsg);
		});		// end of flow.exec

		setTimeout(function() {
			reqCount.should.equal(1);

			monitorConsole.stop();
			masterConsole.stop();
			done();
		}, WAIT_TIME);
	});

	it('should fail if the module is disable', function(done) {
		var monitorId = 'connector-server-1';
		var monitorType = 'connector';
		var moduleId = 'testModuleId';
		var orgMsg = {msg: 'message to someone'};

		var masterConsole = new ConsoleService({
			type: 'master', 
			port: masterPort
		});

		masterConsole.register(moduleId, {
			masterHandler: function(msg, cb) {
				// should not come here
				true.should.not.be.ok();
			}
		});

		masterConsole.disable(moduleId);

		var monitorConsole = new ConsoleService({
			host: masterHost, 
			port: masterPort, 
			id: monitorId, 
			type: monitorType
		});

		monitorConsole.register(moduleId, {
			monitorHandler: function(msg, cb) {
				// should not come here
				true.should.not.be.ok();
			}
		});

		monitorConsole.disable(moduleId);

		flow.exec(function() {
			masterConsole.start(this);
		}, 
		function(err) {
			should.not.exist(err);
			monitorConsole.start(this);
		}, 
		function(err) {
			should.not.exist(err);
			monitorConsole.agent.notify(moduleId, orgMsg);
			masterConsole.agent.notifyById(monitorId, moduleId, orgMsg);
		});		// end of flow.exec

		setTimeout(function() {
			monitorConsole.stop();
			masterConsole.stop();
			done();
		}, WAIT_TIME);
	});

	it('should fail if the monitor not exists', function(done) {
		done();
	});
});