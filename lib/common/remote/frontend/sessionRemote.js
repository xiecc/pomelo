/**
 * Remote session service for frontend server.
 * Set session info for backend servers.
 */
var logger = require('pomelo-logger').getLogger(__filename);


module.exports = function(app) {
	return new Remote(app);
};

var Remote = function(app) {
	this.app = app;
};

Remote.prototype.bind = function(sid, uid, cb) {
	this.app.get('sessionService').bind(sid, uid, cb);
};

Remote.prototype.push = function(sid, content, cb) {
	this.app.get('sessionService').import(sid, content, cb);
};
