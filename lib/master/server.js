var pomelo = require('../pomelo');
var ServerAgent = require('./serverAgent').ServerAgent;
var logger = require('../util/log/log').getLogger(__filename);
var express = require('express');
var exec = require("child_process").exec;

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
    var profilerAgent = require('./profilerAgent');
    profilerAgent.start(server.wsPort || 2337);

    var commandPort = app.master.commandPort;
    io = require('socket.io').listen(commandPort);
};

server.afterStart = function () {
    function getNodeInfo(app) {
        var nodes = app.get('serverAgent').nodes;
        var processInfo = [];
        for (var nodeId in nodes) {
            var node = nodes[nodeId];
            processInfo.push(node.info.processInfo);
        }
        return processInfo;
    }

    // stop signal
    process.on('SIGTERM', function () {
        console.log("stopping the pomelo.");
    });

    // kill signal
    process.on('SIGHUP', function () {
        setTimeout(function () {
            var app = pomelo.app;
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

        }, 5000);


    });
    // list signal
    process.on('SIGINT', function () {
        if(!io) {
            return;
        }
        
        io.sockets.on('connection', function (socket) {
            socket.on('message', function (data) {
                var app = pomelo.app;
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
        });
    });

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

