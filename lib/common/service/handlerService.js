var logger = require('pomelo-logger').getLogger(__filename);
var forward_logger = require('pomelo-logger').getLogger('forward-log');
var utils = require('../../util/utils');

/**
 * Handler service.
 * Dispatch request to the relactive handler.
 * 
 * @param {Object} app      current application context
 * @param {Object} handlers handler map
 */
var Service = function(app, handlers) {
	this.app = app;
	this.handlers = handlers;
};

module.exports = Service;

Service.prototype.name = 'handler';

/**
 * Handler the request.
 * Process the request directly if the route type matches current server type.
 * Or just forward to the other server if the route type dose not match.
 *
 * @param msg {Object}: client request message.
 * @param session {Object}: session object for current request
 * @param cb {Function}: callback function for the handler has finished.
 */
Service.prototype.handle = function(msg, session, cb){
	var routeRecord = parseRoute(msg.route);
	if(!routeRecord) {
		cb(new Error('meet unknown route message %j', msg.route));
		return;
	}

	if(this.app.get('serverType') === routeRecord.serverType) {
		// the request should be processed by current server
		var originMsg = msg.body;
		if(typeof originMsg === 'string') {
			originMsg = JSON.parse(originMsg);
		}
		var handler = getHandler(this.handlers, routeRecord);
		if(!handler) {
			logger.error('[handleManager]: fail to find handler for %j', msg.route);
			cb(new Error('fail to find handler for ' + msg.route));
			return;
		}
		var start = Date.now();
		handler[routeRecord.method](originMsg, session, function(err,resp){
			var log = {
				route : msg.route,
				args : msg,
				time : utils.format(new Date(start)),
				timeUsed : new Date() - start
			};
			forward_logger.info(JSON.stringify(log));
			cb(err,resp);
		});
		return;
	}

	//should route to other servers
	try {
		this.app.sysrpc[routeRecord.serverType].msgRemote.forwardMessage(
			session,
			msg, 
			session.export(), 
			function(err, resp) {
				if(err) {
					logger.error('[handlerManager] fail to process remote message:' + err.stack);
				}
				cb(err, resp);
			}
		);
	} catch(err) {
		logger.error('[handlerManager] fail to forward message:' + err.stack);
		cb(err);
	}
};

/**
 * Get handler instance by routeRecord.
 * 
 * @param  {Object} handlers    handler map
 * @param  {Object} routeRecord route record parsed from route string
 * @return {Object}             handler instance if any matchs or null for match fail
 */
var getHandler = function(handlers, routeRecord) {
	var handler = handlers[routeRecord.handler];
	if(!handler) {
		return null;
	}
	if(typeof handler[routeRecord.method] !== 'function') {
		return null;
	}
	return handler;
};

/**
 * Parse route string.
 * 
 * @param  {String} route route string, such as: serverName.handlerName.methodName
 * @return {Object}       parse result object or null for illeagle route string
 */
var parseRoute = function(route) {
	if(!route) {
		return null;
	}
	var ts = route.split('.');
	if(ts.length !== 3) {
		return null;
	}

	return {
		serverType: ts[0], 
		handler: ts[1], 
		method: ts[2]
	};
};