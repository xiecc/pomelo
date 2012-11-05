/*!
 * Pomelo -- proto
 * Copyright(c) 2012 xiechengchao <xiecc@163.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var fs = require('fs');
var utils = require('./util/utils');
var logger = require('pomelo-logger').getLogger(__filename);
var async = require('async');
var log = require('./util/log');

/**
 * Application prototype.
 *
 * @module
 */
var Application = module.exports = {};

/**
 * Application states
 */
var STATE_INITED  = 1;  // app has inited
var STATE_START = 2;	// app start
var STATE_STARTED = 3;	// app has started
var STATE_STOPED  = 4;  // app has stoped

/**
 * Initialize the server.
 *
 *   - setup default configuration
 *   - setup default middleware
 *   - setup route reflection methods
 *
 * @api private
 */
Application.init = function(){
	logger.info('app.init invoked');
	this.loaded = [];
	this.components = {};
	this.settings = {};
	this.routes = {};
	this.modules = {};
	this.befores = [];
	this.afters = [];
	this.state = STATE_INITED;
};

/**
 * Get application base path
 * 
 * @return {String} application base path
 */
Application.getBase = function() {
	return this.get('base') || process.cwd();
};

/**
 * Load server info from configure file.
 * 
 * @api private
 */
Application.loadServers = function() {
	this.loadConfig('servers', this.getBase() + '/config/servers.json');
	var servers = this.get('servers');
	var serverMap = {}, slist, i, l, server;
	for(var serverType in servers) {
		slist = servers[serverType];
		for(i=0, l=slist.length; i<l; i++) {
			server = slist[i];
			server.serverType = serverType;
			serverMap[server.id] = server;
		}
	}

	this.set('serverMap', serverMap);
};

/**
 * Initialize application configuration.
 *
 * @api private
 */
Application.defaultConfiguration = function () {
	this.set('env', process.env.NODE_ENV || 'development');
	this.loadServers();
	this.loadConfig('master', this.getBase() + '/config/master.json');
	this.processArgs();
	this.configLogger();
	if(this.isFrontend()) {
		this.set('sessionService', require('./common/service/sessionService'));
	}
};

Application.configLogger = function() {
	if(process.env.POMELO_LOGGER !== 'off') {
		log.configure(this, this.getBase() + '/config/log4js.json');
	}
};

/**
 * Process server start command
 *
 * @return {Void}
 *
 * @api private
 */
Application.processArgs = function(){
	var args = utils.argsInfo(process.argv);

	var serverType = args.serverType || 'master';
	var serverId = args.serverId || this.get('master').id;

	this.set('main', args.main);
	this.set('env', args.env || 'development');
	this.set('serverType', serverType);
	this.set('serverId', serverId);
	if(serverType !== 'master') {
		this.set('curServer', this.getServerById(serverId));
	} else {
		this.set('curServer', this.get('master'));
	}
	logger.info('application inited: %j', serverId);
};

/**
 * add a filter to before and after filter
 *
 * @param {Object} filter provide before and after filter method. {before: function, after: function}
 */
Application.filter = function (filter) {
	this.befores.push(filter);
	this.afters.push(filter);
};

/**
 * add before filter
 *
 * @param {Object|Function} bf
 */
Application.before = function (bf) {
	this.befores.push(bf);
};

/**
 * add after filter
 *
 * @param {Object|Function} fn
 */
Application.after = function (fn) {
	this.afters.push(fn);
};

/**
 * Load component
 *
 * param  {String} name    (optional) name of the component
 * param  {Object} component component instance or factory function of the component
 * param  {[type]} opts    (optional) construct parameters for the factory function
 * return {Object}			app instance for chain invoke
 */
Application.load = function(name, component, opts) {
	if(typeof name !== 'string') {
		opts = component;
		component = name;
		name = null;
		if(typeof component.name === 'string') {
			name = component.name;
		}
	}

	if(typeof component === 'function') {
		component = component(Application, opts);
	}

	if(!component) {
		// maybe some component no need to join the components management
		logger.info('load empty component');
		return this;
	}

	if(!name && typeof component.name === 'string') {
		name = component.name;
	}

	if(name && this.components[name]) {
		// ignore duplicat component
		logger.warn('ignore duplicate component: %j', name);
		return;
	}

	this.loaded.push(component);
	if(name) {
		// components with a name would get by name throught app.components later.
		this.components[name] = component;
	}

	return this;
};

/**
 * Set the route function for the specified server type.
 * 
 * @param  {String} serverType server type string
 * @param  {Function} routeFunc  route function. routeFunc(session, msg, servers, cb)
 * @return {Object}			current application instance for chain invoking
 */
Application.route = function(serverType, routeFunc) {
	this.routes[serverType] = routeFunc;
	return this;
};

/**
 * Load default components for application.
 * 
 * @api private
 */
Application.loadDefaultComponents = function(){
	var pomelo = require('./pomelo');
	// load system default components
	if (this.serverType === 'master') {
		this.load(pomelo.master);
	} else {
		this.load(pomelo.proxy, this.get('proxyConfig'));
		if(this.getServerById(this.get('serverId')).port) {
			this.load(pomelo.remote, this.get('remoteConfig'));
		}
		if(this.isFrontend()) {
			this.load(pomelo.connection);
			this.load(pomelo.connector);
		}
		this.load(pomelo.server);
	}
	this.load(pomelo.monitor);
};

/**
 * Start components.
 *
 * @param  {Function} cb callback function
 */
Application.start = function(cb) {
	if(this.state > STATE_INITED) {
		utils.invokeCallback(cb, new Error('application has already start.'));
		return;
	}
	this.loadDefaultComponents();
	var self = this;
	this._optComponents('start', function(err) {
		self.state = STATE_START;
		utils.invokeCallback(cb, err);
	});
};

/**
 * Lifecycle callback for after start.
 *
 * @param  {Function} cb callback function
 * @return {Void}
 */
Application.afterStart = function(cb) {
	if(this.state !== STATE_START) {
		utils.invokeCallback(cb, new Error('application is not running now.'));
		return;
	}

	var self = this;
	this._optComponents('afterStart', function(err) {
		self.state = STATE_STARTED;
		utils.invokeCallback(cb, err);
	});
};

/**
 * Stop components.
 *
 * @param  {Boolean} force whether stop the app immediately
 */
Application.stop = function(force) {
	if(this.state > STATE_STARTED) {
		logger.warn('[pomelo application] application is not running now.');
		return;
	}
	this.state = STATE_STOPED;
	stopComps(this.loaded, 0, force, function() {
		if(force) {
			process.exit(0);
		}
	});

};

/**
 * Stop components.
 *
 * @param  {Array}	comps component list
 * @param  {Number}   index current component index
 * @param  {Boolean}  force whether stop component immediately
 * @param  {Function} cb
 */
var stopComps = function(comps, index, force, cb) {
	if(index >= comps.length) {
		cb();
		return;
	}
	var comp = comps[index];
	if(typeof comp.stop === 'function') {
		comp.stop(force, function() {
			// ignore any error
			stopComps(comps, index +1, force, cb);
		});
	} else {
		stopComps(comps, index +1, force, cb);
	}
};

/**
 * Apply command to loaded components.
 * This method would invoke the component {method} in series.
 * Any component {method} return err, it would return err directly.
 *
 * @param  {String}   method component lifecycle method name, such as: start, afterStart, stop
 * @param  {Function} cb
 * @api private
 */
Application._optComponents = function(method, cb) {
	var i = 0;
	async.forEachSeries(this.loaded, function(comp, done) {
		i++;
		if(typeof comp[method] === 'function') {
			comp[method](done);
		} else {
			done();
		}
	}, function(err) {
		if(err) {
			logger.error('[pomelo application] fail to operate component, method:%s, err:' + err.stack, method);
		}
		cb(err);
	});
};

/**
 * Assign `setting` to `val`, or return `setting`'s value.
 * Mounted servers inherit their parent server's settings.
 *
 * @param {String} setting the setting of application
 * @param {String} val the setting's value
 * @return {Server|Mixed} for chaining, or the setting value
 * @memberOf Application
 */
Application.set = function (setting, val) {
	if (1 === arguments.length) {
		if (this.settings.hasOwnProperty(setting)) {
			return this.settings[setting];
		} else if (this.parent) {
			return this.parent.set(setting);
		}
	} else {
		this.settings[setting] = val;
		this[setting] = val;
		return this;
	}
};

/**
 * Load Configure json file to settings.
 *
 * @param {String} key environment key
 * @param {String} val environment value
 * @return {Server|Mixed} for chaining, or the setting value
 * @api public
 */
Application.loadConfig = function (key, val) {
	var env = this.get('env');
	if (utils.endsWith(val, '.json')) {
		val = require(val); 
		if (val[env]) {
			val = val[env];
		}
	}
	this.set(key,val);
};

/**
 * Get servers from configure file
 * 
 * @param {String} val
 * @return {String} servers
 *
 */
Application.getServers = function (val) {
	if (utils.endsWith(val, '.json')) {
		val = require(val);
	}
	var servers = val[Application.env];
	return servers;
};

/**
 * Get property from setting
 * 
 * @param {String} setting application setting
 * @return {String} val
 * @memberOf Application
 */
Application.get = function (setting) {
	var val = this.settings[setting];
	return val;
};

/**
 * Check if `setting` is enabled.
 *
 * @param {String} setting application setting
 * @return {Boolean}
 * @memberOf Application
 */
Application.enabled = function (setting) {
	return !!this.set(setting);
};

/**
 * Check if `setting` is disabled.
 *
 * @param {String} setting application setting
 * @return {Boolean}
 * @memberOf Application
 */
Application.disabled = function (setting) {
	return !this.set(setting);
};

/**
 * Enable `setting`.
 *
 * @param {String} setting application setting
 * @return {app} for chaining
 * @memberOf Application
 */
Application.enable = function (setting) {
	return this.set(setting, true);
};

/**
 * Disable `setting`.
 *
 * @param {String} setting application setting
 * @return {app} for chaining
 * @memberOf Application
 */
Application.disable = function (setting) {
	return this.set(setting, false);
};

/**
 * Configure callback for the specified env and server type. 
 * When no env is specified that callback will
 * be invoked for all environments and when no type is specified 
 * that callback will be invoked for all server types. 
 *
 * Examples:
 *
 *	app.configure(function(){
 *		// executed for all envs and server types
 *	});
 *
 *	app.configure('development', function(){
 *		// executed development env
 *	});
 *
 *	app.configure('development', 'connector', function(){
 *		// executed for development env and connector server type
 *	});
 *
 * @param {String} env application environment 
 * @param {Function} fn callback function
 * @param {String} type server type
 * @return {Application} for chaining
 * @memberOf Application
 */
Application.configure = function (env, type, fn) {
	var args = [].slice.call(arguments);
	fn = args.pop();
	env = 'all'; 
	type = 'all';

	if(args.length > 0) {
		env = args[0];
	}
	if(args.length > 1) {
		type = args[1];
	}

	if (env === 'all' || env.indexOf(this.settings.env) >= 0) {
		if (type === 'all' || type.indexOf(this.settings.serverType) >= 0) {
			fn.call(this);
		}
	}
	return this;
};

/**
 * Find server by server type and server id
 * 
 * @param {String} serverType
 * @param {String} serverId
 * @return {server} curServer
 * @api public
 */
Application.findServer = function (serverType, serverId) {
	var servers = Application.get('servers');//[app.env];
	if(serverType === 'master') {
		return this.master;
	} else {
	var typeServers = servers[serverType];
		if(typeServers) {
			for (var i = 0; i < typeServers.length; i++) {
				var curServer = typeServers[i];
				if (curServer.id === serverId) {
					curServer.serverType = serverType;
					return curServer;
				}
			}
		}
	}
};

/**
 * Get server info by server id.
 * 
 * @param  {String} serverId server id
 * @return {Object} server info or undefined
 * @api public
 */
Application.getServerById = function(serverId) {
	return this.get('serverMap')[serverId];
};

/**
 * Get server infos by server type.
 * 
 * @param  {String} serverType server type
 * @return {Array}			server info list
 * @api public
 */
Application.getServersByType = function(serverType) {
	return this.get('servers')[serverType];
};

/**
 * Check the server whether is a frontend server
 *
 * @param  {server}  server server info. it would check current server
 *						if server not specified
 * @return {Boolean}
 */
Application.isFrontend = function(server) {
	server = server || Application.get('curServer');
	return !!server && !!server.wsPort;
};

/**
 * Check the server whether is a backend server
 *
 * @param  {server}  server server info. it would check current server
 *						if server not specified
 * @return {Boolean}
 */
Application.isBackend = function(server) {
	server = server || Application.get('curServer');
	return !!server && !server.wsPort;
};

/**
 * Check whether current server is a master server
 *
 * @return {Boolean}
 */
Application.isMaster = function() {
	return Application.serverType === 'master';
};

/**
 * register admin modules 
 * @param {moduleId} module id
 * @param {module} module object
 */
 Application.registerAdmin = function(moduleId, module){
	this.modules[moduleId] = module;
 };
