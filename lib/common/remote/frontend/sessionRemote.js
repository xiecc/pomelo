/**
 * Remote session service for frontend server.
 * Set session info for backend servers.
 */
var sessionService = require('../../service/sessionService');
var logger = require('pomelo-logger').getLogger(__filename);


var exp = module.exports;

/**
 * Change area info in session.
 *
 * @param {String} uid user id
 * @param {String} key key that would be set in session
 * @param {Object} value value that would be set in value
 * @param cb {Function} callback function
 */
exp.set = function(uid, key, value, cb){
  var session = sessionService.getSessionByUid(uid);
  if(session){
    session.set(key, value);
    cb();
  }else{
    cb(new Error('fail to set value for session not exist. uid:' + uid));
  }
};

/**
 * Kick a user offline
 *
 * @param uid {String} user id
 * @param cb {Function} callback function
 */
exp.kick = function(uid, cb) {
	sessionService.kick(uid, cb);
};
