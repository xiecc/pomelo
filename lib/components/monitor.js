/**
 * Component for monitor.
 * Load and start monitor client.
 */
var monitorClient = require('../monitor/monitorClient');
var logger = require('../util/log/log').getLogger(__filename);
var utils = require('../util/utils');

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @return {Object}      component instances
 */
module.exports = function(app) {
  return new Monitor(app);
};

/**
 * Monitor component class
 * 
 * @param {Object} app  current application context
 */
var Monitor = function(app) {
  this.app = app;
};

var pro = Monitor.prototype;

/**
 * Component lifecycle function
 * 
 * @param  {Function} cb 
 * @return {Void}      
 */
pro.start = function(cb) {
  var master = this.app.master;
  logger.info('monitor connect to master %j', master);
  monitorClient.start(this.app, master);
  utils.invokeCallback(cb);
};

/**
 * Component lifecycle function
 * 
 * @param  {Boolean}   force whether stop the component immediately 
 * @param  {Function}  cb    
 * @return {Void}         
 */
pro.stop = function(force, cb) {
  utils.invokeCallback(cb);
};
