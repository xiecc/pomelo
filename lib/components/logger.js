/**
 * Component for logger.
 * Load logger config and init logger.
 */
var log = require('../util/log/log');
var exp = module.exports;

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @param  {Object} opts construct parameters
 * @return {Object}      component instance
 */
module.exports = function(app, opts) {
  var logConfFile = app.get('dirname')+'/config/log4js.json';
  log.configure(logConfFile);
  // no need to add component into the app components
};
