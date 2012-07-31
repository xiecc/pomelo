/**
 * Default configure template for application.
 */
var pomelo = require('./pomelo');
var handlerManager = require('./handlerManager');
var logger = require('./util/log/log').getLogger(__filename);
var hashmap = require('./util/hashMap').HashMap;
var exports = module.exports;


/**
 * Create and init the app instance
 */
exports.init = function () {
    var app = pomelo.createApp();
    var args = process.argv;
    var hm = new hashmap();

    for (var i = 2; i < args.length; i++) {
        hm.put(args[i], args[i + 1]);
    }

    var env = hm.get('env') === undefined ? 'development' : hm.get('env');
    var serverType = hm.get('serverType') === undefined ? 'master' : hm.get('serverType');
    var serverId = hm.get('serverId') === undefined ? 'master-server-1' : hm.get('serverId');
    var debugServerId = hm.get('debugServerId') === undefined ? 'false' : hm.get('debugServerId');
    var debugPort = hm.get('debugPort') === undefined ? 'false' : hm.get('debugPort');


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

