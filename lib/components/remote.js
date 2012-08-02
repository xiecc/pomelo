/**
 * Component for remote service.
 * Load remote service and add to global context.
 */
var utils = require('../util/utils');
var logger = require('../util/log/log').getLogger(__filename);
var path = require('path');
var pathUtil = require('../util/pathUtil');
var RemoteServer = require('pomelo-rpc').server;
var exp = module.exports;

/**
 * Remote component factory function
 * 
 * @param  {Object} app  current application context
 * @param  {Object} opts construct parameters
 *                       opts.acceptorFactory {Object}: acceptorFactory.create(opts, cb)
 * @return {Object}      remote component instances
 */
module.exports = function(app, opts) {
  opts = opts || {};
  return new Remote(app, opts);
};

var Remote = function(app, opts) {
  opts.port = app.findServer(app.serverType, app.serverId).port;
  this.remote = genRemote(app, opts);
};

var pro = Remote.prototype;

/**
 * Remote component lifecycle function
 * 
 * @param  {Function} cb 
 * @return {Void}      
 */
pro.start = function(cb) {
  this.remote.start(cb);
};

/**
 * Remote component lifecycle function
 * 
 * @param  {Boolean} whether stop the component immediately 
 * @return {Void}      
 */
pro.stop = function(force) {
  this.remote.stop(force);
};

var getRemotePaths = function(app) {
  var paths = [];
  
  var role;
  // master server should not come here
  if(app.isFrontendServer()) {
    role = 'frontend';
  } else {
    role = 'backend';
  }

  var sysPath = pathUtil.getSysRemotePath(role);
  if(path.existsSync(sysPath)) {
    paths.push(pathUtil.remotePathRecord('sys', app.serverType, sysPath));
  }
  var userPath = pathUtil.getUserRemotePath(app.get('dirname'), app.serverType);
  if(path.existsSync(userPath)) {
    paths.push(pathUtil.remotePathRecord('user', app.serverType, userPath));
  }

  return paths;
};

/**
 * Generate remote server instance
 * 
 * @param  {Object} app  
 * @param  {Object} opts 
 * @return {Object}      remote server instance
 */
var genRemote = function(app, opts) {
  opts.paths = getRemotePaths(app);
  opts.context = app;
  return RemoteServer.create(opts);
};

/**
 * component name
 */
exp.name = 'remote';
