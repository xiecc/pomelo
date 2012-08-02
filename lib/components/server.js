/**
 * Component for server starup.
 */
var utils = require('../util/utils');
var logger = require('../util/log/log').getLogger(__filename);
var Server = require('../server/server');
var exp = module.exports;

module.exports = function(app, opts) {
  opts = opts || {};
  return new ServerComponent(app, opts);
};

/**
 * Proxy component class
 * 
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
var ServerComponent = function(app, opts) {
  this.server = Server.create(app, opts);
};

var pro = ServerComponent.prototype;

/**
 * Component lifecycle callback 
 * 
 * @param  {Function} cb 
 * @return {Void}     
 */
pro.start = function(cb) {
  this.server.start();
  process.process.nextTick(cb);
};

/**
 * Component lifecycle callback 
 * 
 * @param  {Function} cb 
 * @return {Void}     
 */
pro.afterStart = function(cb) {
  this.server.afterStart();
  process.process.nextTick(cb);
};

/**
 * component name
 */
exp.name = 'server';
