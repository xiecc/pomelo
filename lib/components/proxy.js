/**
 * Component for proxy.
 * Generate proxies for rpc client.
 */
var utils = require('../util/utils');
var logger = require('../util/log/log').getLogger(__filename);
var Client = require('pomelo-rpc').client;
var pathUtil = require('../util/pathUtil');

module.exports = function(app, opts) {
  opts = opts || {};
  return new Proxy(app, opts);
};

/**
 * Proxy component class
 * 
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 *                      opts.route: (optional) rpc message route function, route(routeParam, msg, cb), 
 *                      opts.mailBoxFactory: (optional) mail box factory instance.
 */
var Proxy = function(app, opts) {
  this.client = Client.create(opts);
  app.set('rpc', this.client.proxies.user);
  app.set('sysrpc', this.client.proxies.sys);
  //TODO: backward compatibile with old version, this should be remote later
  app.set('proxyMap', this.client.proxies);
};

var pro = Proxy.prototype;

/**
 * Component lifecycle callback 
 * 
 * @param  {Function} cb 
 * @return {Void}     
 */
pro.afterStart = function(cb) {
  this.client.start(cb);
};

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
      if(app.isFrontendServer(sinfo)) {
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

/**
 * component name
 */
module.exports.name = 'proxy';
