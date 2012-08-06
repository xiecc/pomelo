/**
 * Component for monitor.
 * Load and start monitor client.
 */
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

var Monitor = function(app) {
  this.app = app;
};

var pro = Monitor.prototype;

pro.start = function(cb) {
  var master = this.app.master;
  var monitorClient = require('../monitor/monitorClient.js');
  logger.info('monitor connect to master %j', master);
  monitorClient.start(this.app, master);

  utils.invokeCallback(cb);
};

pro.stop = function(force, cb) {
  //TODO: stop master server
  utils.invokeCallback(cb);
};