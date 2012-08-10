var starter = require('../master/starter');
var utils = require('../util/utils');
var logger = require('../util/log/log').getLogger(__filename);

/**
 * Component factory function
 *
 * @param  {Object} app  current application context
 * @return {Object}      component instances
 */
module.exports = function (app) {
    return new Master(app);
};

var Master = function (app) {
    this.app = app;
};

var pro = Master.prototype;

pro.start = function (cb) {
    listen(this.app);
    runServers(this.app, this.app.servers);

    utils.invokeCallback(cb);
};

pro.stop = function (force, cb) {
    //TODO: stop master server
    utils.invokeCallback(cb);
};

var listen = function (app) {
    var master = app.master;
    app.set('serverId', master.id);
    var serverInst = require('../master/server.js');
    serverInst.listen(master);
    app.set('currentServer', serverInst);
};

var runServers = function (app, servers, except) {
    for (var serverType in servers) {
        var typeServers = servers[serverType];
        var debug = app.get("debug").split(',');
        var debugPorts = app.get("debugPorts").split(',');
        var map = {};
        for (var i = 0; i < debug.length; i++)
            map[debug[i]] = debugPorts[i];

        for (var i = 0; i < typeServers.length; i++) {
            var curServer = typeServers[i];
            curServer.serverType = serverType;
            if (utils.contains(curServer.id, debug)) {
                debugRun(app, curServer, map[curServer.id]);
            } else {
                run(app, curServer);
            }
        }
    }
};

var run = function (app, server) {
    var cmd = 'cd ' + process.cwd() + ' && node  ' + app.main + '  env ' + app.env + '  serverType ' + server.serverType + ' serverId ' + server.id;

    if (app.get('gc') !== false && utils.contains(server.id, app.get('gc').split(',')))
        cmd += ' gc ';
    if (app.get('trace') !== false && utils.contains(server.id, app.get('trace').split(',')))
        cmd += ' trace ';
    if (app.get('prof') !== false && utils.contains(server.id, app.get('prof').split(',')))
        cmd += ' prof ';
    if (server.host === '127.0.0.1' || server.host === 'localhost') {
        starter.run(cmd);
    } else {
        starter.sshrun(cmd, server.host);
    }
};

var debugRun = function (app, server, port) {

    var cmd = 'cd ' + process.cwd() + ' && node --debug=' + port + '  ' + app.main + ' env ' + app.env + '  serverType ' + server.serverType + '  serverId ' + server.id;
    if (app.get('gc') !== false && utils.contains(server.id, app.get('gc').split(',')))
        cmd += ' gc ';
    if (app.get('trace') !== false && utils.contains(server.id, app.get('trace').split(',')))
        cmd += ' trace ';
    if (app.get('prof') !== false && utils.contains(server.id, app.get('prof').split(',')))
        cmd += ' prof ';
    if (server.host === '127.0.0.1' || server.host === 'localhost') {
        starter.run(cmd);
    } else {
        starter.sshrun(cmd, server.host);
    }
};
