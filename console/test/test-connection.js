/*
var monitorAgent = require('../monitorAgent.js').monitorAgent;
var masterAgent = require('../masterAgent.js').masterAgent;

var master = new masterAgent().listen(8002);

var monitor = new monitorAgent("monitor","info").connect("http://localhost",8002);
*/

var consoleService = require('../lib/consoleService.js').consoleService;
var systemInfo = require('../lib/modules/systemInfo.js').systemInfo;
var util = require('util');

var masterConsole = new consoleService({serverId:"master-1",serverType:"master",host:"http://localhost",port:8001});
//console.log(util.inspect(new systemInfo(masterConsole), false, null));
masterConsole.register("systemInfo",new systemInfo(masterConsole));
masterConsole.start(masterConsole);

var monitorConsole = new consoleService({serverId:"monitor-1",serverType:"monitor",masterHost:"http://localhost",masterPort:8001});
monitorConsole.register("systemInfo",new systemInfo(monitorConsole));
monitorConsole.start(monitorConsole);

var monitorConsole1 = new consoleService({serverId:"monitor-2",serverType:"monitor",masterHost:"http://localhost",masterPort:8001});
monitorConsole1.register("systemInfo",new systemInfo(monitorConsole1));
monitorConsole1.start(monitorConsole1);

var monitorConsole2 = new consoleService({serverId:"monitor-3",serverType:"monitor",masterHost:"http://localhost",masterPort:8001});
monitorConsole2.register("systemInfo",new systemInfo(monitorConsole2));
monitorConsole2.start(monitorConsole2);