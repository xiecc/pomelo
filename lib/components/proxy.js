/**
 * Component for proxy.
 * Generate proxies for rpc client.
 */
var utils = require('../util/utils');
var logger = require('../util/log/log').getLogger(__filename);
var Client = require('pomelo-rpc').client;
var pathUtil = require('../util/pathUtil');

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @param  {Object} opts construct parameters
 *                      opts.router: (optional) rpc message route function, route(routeParam, msg, cb), 
 *                      opts.mailBoxFactory: (optional) mail box factory instance.
 * @return {Object}      component instance
 */
module.exports = function(app, opts) {
  opts = opts || {};
  return new Proxy(app, opts);
};

module.exports.name = 'proxy';

/**
 * Proxy component class
 * 
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
var Proxy = function(app, opts) {
  this.client = null;
  this.app = app;
  this.client = genRpcClient(this.app, opts);
};

var pro = Proxy.prototype;

pro.start = function(cb) {
  process.nextTick(function() {
    utils.invokeCallback(cb);
  });
};

/**
 * Component lifecycle callback 
 * 
 * @param  {Function} cb 
 * @return {Void}     
 */
pro.afterStart = function(cb) {
  this.app.set('rpc', this.client.proxies.user);
  this.app.set('sysrpc', this.client.proxies.sys);
  this.client.start(cb);
};

pro.name = 'proxy';

var genRpcClient = function(app, opts) {
  var paths = getProxyPaths(app);
  opts.paths = paths;
  opts.servers = app.servers;
  opts.context = app;

  return Client.create(opts);
};

/**
 * Get proxy path for rpc client.
 * Iterate all the remote service path and create remote path record.
 * 
 * @param  {Object} app current application context
 * @return {Array}     remote path record array
 */
var getProxyPaths = function(app) {
  var paths = [], appBase = app.get('dirname'), p;
  var servers = app.servers, slist, sinfo, i, l;
  for(var serverType in servers) {
    slist = servers[serverType];
    for(i=0, l=slist.length; i<l; i++) {
      sinfo = slist[i];
      // sys remote service path record
      if(app.isFrontend(sinfo)) {
        p = pathUtil.getSysRemotePath('frontend');
      } else {
        p = pathUtil.getSysRemotePath('backend');
      }
      if(p) {
        paths.push(pathUtil.remotePathRecord('sys', serverType, p));
      }

      // user remote service path record
      p = pathUtil.getUserRemotePath(appBase, serverType);
      if(p) {
        paths.push(pathUtil.remotePathRecord('user', serverType, p));
      }
    } // end of inner for
  } // end of outer for

  return paths;
};
