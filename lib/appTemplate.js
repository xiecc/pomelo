/**
 * Default configure template for application.
 */
var pomelo = require('./pomelo');
var handlerManager = require('./handlerManager');
var logger = require('./util/log/log').getLogger(__filename);
var exports = module.exports;


/**
 * Create and init the app instance
 */
exports.init = function () {
    var app = pomelo.createApp();
    var args = process.argv;
    var hm = {};

    for (var i = 2; i < args.length; i++) {
        hm[args[i]] = args[i + 1];
    }

    var env = hm['env'] === undefined ? 'development' : hm['env'];
    var serverType = hm['serverType'] === undefined ? 'master' : hm['serverType'];
    var serverId = hm['serverId'] === undefined ? 'master-server-1' : hm['serverId'];
    var debugServerId = hm['debugServerId'] === undefined ? 'false' : hm['debugServerId'];
    var debugPort = hm['debugPort'] === undefined ? 'false' : hm['debugPort'];


    app.set('main', args[1]);
    app.set('env', env);
    app.set('serverType', serverType);
    app.set('serverId', serverId);
    app.set('debugServerId', debugServerId);
    app.set('debugPort', debugPort);

    return app;
};

/**
 * Do the default configure for the app instance.
 */
exports.defaultConfig = function (app) {
    app.configure(function () {
        app.set('schedulerServiceConfig', app.get('dirname') + '/config/scheduler.json');

        app.set('servers', app.get('dirname') + '/config/servers.json');
        app.set('master', app.get('dirname') + '/config/master.json');
        app.set('redis', app.get('dirname') + '/config/redis.json');
        app.set('mysql', app.get('dirname') + '/config/mysql.json');

        app.load(pomelo.area);
        app.load(pomelo.logger);
        app.load(pomelo.proxy);
    });

    /**
     * add master or normal server
     */
    app.configure('production|development', function () {
        logger.warn('begin to listen with ' + '[serverType]:' + app.serverType + ' [serverId]:' + app.serverId);
        if (app.serverType === 'master') {
            app.load(pomelo.master);
        } else {
            app.set('server', app.findServer(app.serverType, app.serverId));
            app.load(pomelo.handler);
            app.load(pomelo.remote);
            app.load(pomelo.server);
        }
    });

};

/**
 * Done the app configure.
 */
exports.done = function (app) {
};

