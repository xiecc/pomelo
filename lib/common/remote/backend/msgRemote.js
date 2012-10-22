/**
 * Remote service for backend servers.
 * Receive and process request message that forward from frontend server.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var forward_logger = require('pomelo-logger').getLogger('forward-log');
var sessionService = require('../../service/mockSessionService');

module.exports = function(app) {
  return new Remote(app);
};

var Remote = function(app) {
  this.app = app;
};

/**
 * Forward message from frontend server to other server's handlers
 *
 * @param msg {Object} request message
 * @param session {Object} session object for current request
 * @param cb {Function} callback function
 */
Remote.prototype.forwardMessage = function(msg, session, cb) {
  var server = this.app.components.server;
  if(!server) {
    cb(new Error('server component not enable'));
    return;
  }

  // generate session for current request
  session = sessionService.createSession(session);
  // handle the request
  server.handle(msg, session, function(err, resp) {
    cb(err, resp);
  });
};
