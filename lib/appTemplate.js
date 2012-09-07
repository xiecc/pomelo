/**
 * Default configure template for application.
 */
var pomelo = require('./pomelo');
var logger = require('./util/log/log').getLogger(__filename);
var exports = module.exports;

/**
 * Do the default configure for the app instance.
 */
exports.defaultConfig = function (app) {
    app.configure(function () {
        app.set('servers', app.get('dirname') + '/config/servers.json');
        app.set('master', app.get('dirname') + '/config/master.json');
        app.set('mysql', app.get('dirname') + '/config/mysql.json');
        app.set('logger', app.get('dirname') + '/config/log4js.json');
   });
};

/**
 * Done the app configure.
 */
exports.done = function (app) {
    /**
     * add master or normal server
     */
    app.configure('production|development', function () {
        logger.warn('begin to listen to ' + '[serverType]:' + app.serverType + ' [serverId]:' + app.serverId);
        if (app.serverType === 'master') {
            app.load(pomelo.master);
        } else {
            app.set('server', app.findServer(app.serverType, app.serverId));
            app.load(pomelo.proxy);
            app.load(pomelo.handler);
            app.load(pomelo.remote);
            app.load(pomelo.server);
        }
        app.load(pomelo.monitor);
        app.load(pomelo.logger);
    });
};
