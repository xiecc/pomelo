/**
 * Component for filter.
 * Init filter service and register filters.
 */
var FilterService = require('../common/service/filterService');

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @return {Object}      component instances
 */
module.exports = function(app) {
  var service = new FilterService(app);
  var befores = app.befores;
  var afters = app.afters;

  var i, l;
  for(i=0, l=befores.length; i<l; i++) {
  	service.before(befores[i]);
  }

  for(i=0, l=afters.length; i<l; i++) {
  	service.after(afters[i]);
  }

  return service;
};

/**
 * Load handlers from current application
 *
 * @param {Object} app current application context
 * @return {Object} loader of current application
 */
var loadHandlers = function(app) {
  var p = pathUtil.getHandlerPath(app.getBase(), app.serverType);
  if(p) {
    return Loader.load(p, app);
  }
};