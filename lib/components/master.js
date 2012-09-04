var starter = require('../master/starter');
var utils = require('../util/utils');
var logger = require('../util/log/log').getLogger(__filename);
var Server = require('../master/server');


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
    this.server = new Server(app);
};

var pro = Master.prototype;

pro.start = function (cb) {
    //listen(this.app);
    var self = this;
    this.server.start(function(err) {
        if(err) {
            utils.invokeCallback(cb, err);
            return;
        }
        runServers(self.app, self.app.servers);
        utils.invokeCallback(cb);
    });
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
        for (var i = 0; i < typeServers.length; i++) {
            var curServer = typeServers[i];
            curServer.serverType = serverType;
            run(app, curServer);
        }
    }
};

var run = function (app, server) {
    var cmd = 'cd ' + process.cwd() + ' && node ';
    var arg = app.findServer(server.serverType, server.id)['args'];

    if (arg !== undefined && arg.indexOf('--debug') > 0) {
        var arr = arg.split(' ');
        var str = '';
        for (var i = 0; i < arr.length; i++) {
            if (utils.startWith(arr[i], '--debug'))
                cmd += arr[i];
            else
                str += ' ' + arr[i];
        }
        arg = str;
    }

    cmd += '  ' + app.main + ' env ' + app.env + '  serverType ' + server.serverType + '  serverId ' + server.id;
    if (arg !== undefined)
        cmd += ' ' + arg;

    if (server.host === '127.0.0.1' || server.host === 'localhost') {
        starter.run(cmd);
    } else {
        starter.sshrun(cmd, server.host);
    }
};


