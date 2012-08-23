/**
 * Component for data sync.
 */
var fs = require('fs');
var path = require('path');
var logger = require('../util/log/log').getLogger(__filename);
var utils = require('../util/utils');
var DataSync = require('data-sync');

var instance = null;

/**
 * Sync states
 */
var STATE_STARTED = 1;  // sync has started
var STATE_STOPED  = 2;  // sync has stoped

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @param  {Object} opts construct parameters
 * @return {Object}      component instances
 */
module.exports = function(app, opts) {
  if(instance) {
    // this should be singleton
    return instance;
  }

  if(!opts || !opts.dbclient) {
    throw new Error('opts.dbclient should not be empty.');
  }

  if(!opts.path) {
    throw new Error('opts.path should not be empty.');
  }

  instance = new Sync(app, opts);
  app.set('sync', instance.sync);
  app.set('dbclient', opts.dbclient);

  return instance;
};

var Sync = function(app, opts) {
  this.app = app;
  this.sync = genSync(opts);
  this.dbclient = opts.dbclient;
  this.state = STATE_STARTED;
};

var pro = Sync.prototype;

/**
 *stop the component
 *
 * @param {boolean} force,true or false
 * @param {Function} cb, callback
 *
 */ 
pro.stop = function(force, cb) {
  if(this.state > STATE_STARTED) {
    utils.invokeCallback();
    return;
  }
  this.state = STATE_STOPED;
  this.sync.flushAll();
  var self = this;
  var interval = setInterval(function(){
    if (self.sync.isDone()) {
      clearInterval(interval);
      utils.invokeCallback(cb);
    }
  }, 200);
};

/**
 * Auto-load bundled components with getters.
 */
var load = function(mappingPath) {
  var mapping = {};
  mappingPath += '/';
  logger.info('[sync component] load mapping file ' + mappingPath);
  fs.readdirSync(mappingPath).forEach(function(filename){
    if (!/\.js$/.test(filename)) {return;}
    var name = path.basename(filename, '.js'),key,pro;
    pro = require(mappingPath + name); 
    for (key in pro){
      if (mapping[key]){
        logger.error('[sync component] exist duplicated key map function ' + key + ' ignore it now.');
      } else {
        mapping[key] = pro[key];
      }
    }
  });
  logger.info('[sync component] load mapping file done.' );
  return mapping;
};

/**
 * init sync
 */
var genSync = function(opts){
  var opt = opts || {};
  opt.write = load(opts.path);
  opt.client = opts.dbclient;
  opt.interval = opts.interval || 60 * 1000;
  return new DataSync(opt);
};
