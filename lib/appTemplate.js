/**
 * Default configure template for application.
 */
var pomelo = require('./pomelo');
var handlerManager = require('./handlerManager');
var logger = require('./util/log/log').getLogger(__filename);
var nconf = require('nconf');
var exports = module.exports;

/**
 * Create and init the app instance
 */
exports.init = function () {
    var app = pomelo.createApp();
    var args = process.argv;
    // config
    nconf.argv().env();
    var env = nconf.get('env') === undefined ? 'development' : nconf.get('env');
    var serverType = nconf.get('serverType') === undefined ? 'master' : nconf.get('serverType');
    var serverId = nconf.get('serverId') === undefined ? 'master-server-1' : nconf.get('serverId');
    var debugServerId = nconf.get('debugServerId') === undefined ? 'false' : nconf.get('debugServerId');
    var debugPort = nconf.get('debugPort') === undefined ? 'false' : nconf.get('debugPort');


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
        //app.set('schedulerServiceConfig', app.get('dirname')+'/config/scheduler.json');

        app.set('servers', app.get('dirname') + '/config/servers.json');
        app.set('master', app.get('dirname') + '/config/master.json');
        //app.set('redis', app.get('dirname')+'/config/redis.json');
        app.set('mysql', app.get('dirname') + '/config/mysql.json');

        //app.load(pomelo.area);
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

