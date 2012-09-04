/**
 * Component for master.
 */
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

/**
* Master component class
* 
* @param {Object} app  current application context
*/
var Master = function (app) {
    this.app = app;
    this.server = new Server(app);
};

var pro = Master.prototype;

/**
 * Component lifecycle function
 * 
 * @param  {Function} cb 
 * @return {Void}      
 */
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
//	listen(this.app);
//	runServers(this.app, this.app.servers);
//	utils.invokeCallback(cb);
};

/**
 * Component lifecycle function
 * 
 * @param  {Boolean}   force whether stop the component immediately 
 * @param  {Function}  cb    
 * @return {Void}         
 */
pro.stop = function (force, cb) {
	utils.invokeCallback(cb);
};

pro.name = '__master__';

/**
 * Listen the master server
 * 
 * @param {Object} app current application context
 * @return {Void}
 */
var listen = function (app) {
	var master = app.master;
	app.set('serverId', master.id);
	var serverInst = require('../master/server.js');
	serverInst.listen(master);
	app.set('currentServer', serverInst);
};

/**
 * Run all servers
 *
 * @param {Object} app current application  context
 * @param {Array} servers 
 * @return {Void}
 */
var runServers = function (app, servers) {
	for (var serverType in servers) {
		var typeServers = servers[serverType];
		for (var i = 0; i < typeServers.length; i++) {
			var curServer = typeServers[i];
			curServer.serverType = serverType;
			console.error('run server: %j', curServer);
			run(app, curServer);
		}
	}
};

/**
 * Run server
 * 
 * @param {Object} app current application context
 * @param {Object} server
 * @return {Void}
 */
var run = function (app, server) {
	var cmd = 'cd ' + process.cwd() + ' && node ';
	var arg = app.findServer(server.serverType, server.id)['args'];

        // whether has debug argument
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
        // run server on local or remote
	if (server.host === '127.0.0.1' || server.host === 'localhost') {
		starter.run(cmd);
	} else {
		starter.sshrun(cmd, server.host);
	}
};
