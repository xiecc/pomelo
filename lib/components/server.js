/**
 * Component for server starup.
 */
var Server = require('../server/server');

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @param  {Object} opts construct parameters
 * @return {Object}      component instance
 */
module.exports = function(app, opts) {
  opts = opts || {};
  return new Component(app, opts);
};

/**
 * Server component class
 * 
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
var Component = function(app, opts) {
  opts = opts || {};
  opts.server = app.server;
  this.server = Server.create(app, opts);
};

Component.prototype.name = 'server';

/**
 * Component lifecycle callback 
 * 
 * @param  {Function} cb 
 * @return {Void}     
 */
Component.prototype.afterStart = function(cb) {
  this.server.afterStart();
  process.nextTick(cb);
};

/**
 * Component lifecycle function
 * 
 * @param  {Boolean}   force whether stop the component immediately 
 * @param  {Function}  cb    
 * @return {Void}         
 */
Component.prototype.stop = function(force, cb) {
	this.server.stop();
	process.nextTick(cb);
};

/**
 * Proxy server.handle
 */
Component.prototype.handle = function(msg, session, cb) {
	this.server.handle(msg, session, cb);
};
