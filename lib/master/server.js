var pomelo = require('../pomelo');
var ServerAgent = require('./serverAgent').ServerAgent;
var logger = require('../util/log/log').getLogger(__filename);
var express = require('express');
var exec = require("child_process").exec;
var TIME_WAIT_KILL = 5000;
var TIME_WAIT_STOP = 10000;
/**
 * master server
 */
var server = module.exports;
var dserver;
var handler = {};
var io;

handler.pushStatus = function (serverType, serverId) {
    logger.info(' report status serverType: ' + serverType + ' serverId: ' + serverId);
};

/**
 * 服务器启动前回调(可选)
 */
server.beforeStart = function () {

};

/**
 * 启动服务器
 */
server.start = function () {

};

var serverAgent = null;

server.listen = function (server) {
    var app = pomelo.app;
    this.serverAgent = new ServerAgent();
    this.serverAgent.listen(server.port);
    app.set('serverAgent', this.serverAgent);
    logger.info(' [master server] start listen on server: ' + JSON.stringify(server));
    app.startMonitor();
    this.startQueryServer(server.queryPort);
    this.startCommandServer();
    var profilerAgent = require('./profilerAgent');
    profilerAgent.start(server.wsPort || 2337);
};

server.afterStart = function () {

};

server.startQueryServer = function (port) {
    var app = express.createServer();
    app.use(app.router);
    app.configure('development', function () {
        app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));
    });

    app.configure('production', function () {
        app.use(express.errorHandler());
    });

    var self = this;

    // Routes
    app.get('/', function (req, res) {
        res.writeHeader(200, {
            'content-type':'text/javascript'
        });
        res.end('window.__front_address__=\'' + self.serverAgent.getLowLoadServer() + '\';');
    });

    app.get('/status', function (req, res) {
        res.writeHeader(200, {
            'content-type':'text/plain'
        });
        res.end(JSON.stringify(self.serverAgent.getStatus()));
    });

    app.listen(port);
};

function startCommandServer() {
    var app = pomelo.app;
    var commandPort = app.master.commandPort;
    io = require('socket.io').listen(commandPort);

    function getNodeInfo(app) {
        var nodes = app.get('serverAgent').nodes;
        var processInfo = [];
        for (var nodeId in nodes) {
            var node = nodes[nodeId];
            processInfo.push(node.info.processInfo);
        }
        return processInfo;
    }

    io.sockets.on('connection', function (socket) {
        //list signal
        socket.on('list', function (data) {
            var rs = 'serverId            serverType       pid      cpuAvg     memAvg        time  \n';
            var processInfo = getNodeInfo(app);
            for (var i = 0; i < processInfo.length; i++) {
                if (processInfo[i] === undefined) {
                    continue;
                }
                var obj = JSON.stringify(processInfo[i]);
                var js = JSON.parse(obj);
                rs += js.serverId + '    ' + js.serverType + '    ' + js.pid + '    ' + js.cpuAvg + '     ' + js.memAvg + '       ' + js.time + '\n';
            }
            socket.emit('info', {info:rs});

        });

        //kill signal
        socket.on('kill', function (data) {
            setTimeout(function () {
                var pid = [];
                var serverId = [];
                var processInfo = getNodeInfo(app);
                for (var i = 0; i < processInfo.length; i++) {
                    if (processInfo[i] === undefined) {
                        continue;
                    }
                    var obj = JSON.stringify(processInfo[i]);
                    var js = JSON.parse(obj);
                    pid.push(js.pid);
                    serverId.push(js.serverId);
                }
                app.kill(pid, serverId);
            }, TIME_WAIT_KILL);
        });

        //stop signal
        socket.on('stop', function (data) {
            setTimeout(function () {
                app.stop(false, function () {
                    console.log('stop the program.');
                });
            }, TIME_WAIT_STOP);
        });

    });
}