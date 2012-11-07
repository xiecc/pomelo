var logger = require('pomelo-logger').getLogger(__filename);
var sessionService = require('../common/service/sessionService');
var taskManager = require('../common/service/taskManager');

module.exports = function(app, opts) {
	return new Component(app, opts);
};

/**
 * Connector component. Receive client requests and manage sessions.
 * 
 * @param {Object} app  current application context
 * @param {Object} opts attach parameters
 *                      opts.connector {Object} provides low level network and protocol details implementation between server and clients.
 *                      opts.flushInterval {Number} message queue flush interval
 *                      opts.sendDirectly {Boolean} message should be sent directly or cache and wait for flush
 */
var Component = function(app, opts) {
	opts = opts || {};
	this.app = app;
	this.opts = opts;
	this.flushInterval = opts.flushInterval || 100;	//client message flush interval. default 100ms
	this.sendDirectly = opts.sendDirectly || false;
};

Component.prototype.afterStart = function(cb) {
	var self = this;
	var connectionService = this.app.components.connection;
	var server = this.app.components.server;

	if(!server) {
		cb(new Error('fail to start connector component for no server component found'));
		return;
	}
	
	this.connector = this.opts.connector || getDefaultConnector(this.app);

	this.connector.start();

	this.connector.on('connection', function(socket) {
		if(connectionService) {
			connectionService.increaseConnectionCount();
		}

		//create session for connection
		var session = getSession(socket, self.app);

		socket.on('disconnect', function() {
			var uid = session ? session.uid : null;
			if(connectionService) {
				connectionService.decreaseConnectionCount(uid);
			}
		});

		// new message
		socket.on('message', function(msg) {
			if(!msg) {
				//ignore empty request
				return;
			}

			var type = checkServerType(msg.route);
			if(!type) {
				logger.error('invalid route string. ' + msg.route);
				return;
			}

			var curSession = session.cloneSession();
			curSession.route = msg.route;
			server.handle(msg, curSession, function(err, resp) {
				if(resp) {
					if(!msg.id) {
						logger.warn('try to response to a notify: %j', curSession.route);
						return;
					}
					resp = {
						id: msg.id,
						body: resp
					};
					sessionService.sendMessage(session.key, resp);
				}
			});
		}); //on message end
	}); //on connection end

	if(!this.sendDirectly) {
		setInterval(function() {
			sessionService.flush();
		}, this.flushInterval);
	}

	process.nextTick(cb);
};

Component.prototype.stop = function(force, cb) {
	if(this.connector) {
		this.connector.stop();
		this.connector = null;
	}

	process.nextTick(cb);
};

var getDefaultConnector = function(app) {
	var DefaultConnector = require('../connectors/sioconnector');
	var curServer = app.get('curServer');
	return new DefaultConnector(curServer.wsPort, curServer.host);
};

/**
 * get session for current connection
 */
var getSession = function(socket, app) {
	var connectionService = app.components.connection;
	var session = sessionService.getSession(socket.id);
	if(session) {
		return session;
	}

	session = sessionService.createSession({
		key: socket.id,
		socket: socket,
		frontendId: app.get('serverId')
	});

	// bind events for session
	socket.on('disconnect', session.closing.bind(session));
	socket.on('error', session.closing.bind(session));
	session.on('closing', function(session) {
		if(!!session && !session.uid) {
			//close it directly if not logined
			session.closed();
		}
	});
	session.on('closed', function(session) {
		sessionService.removeSession(session.key);
		taskManager.closeQueue(session.key, true);
	});
	session.on('bind', function(session) {
		connectionService.addLoginedUser(session.uid, {
			loginTime: Date.now(),
			uid: session.uid,
			address: socket.remoteAddress.ip + ':' + socket.remoteAddress.port,
			username: session.username
		});
	});

	return session;
};

/**
 * Get server type form request message.
 */
var checkServerType = function (route) {
	if(!route) {
		return null;
	}
	var idx = route.indexOf('.');
	if(idx < 0) {
		return null;
	}
	return route.substring(0, idx);
};