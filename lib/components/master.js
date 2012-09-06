/**
 * Component for master.
 */

var utils = require('../util/utils');

/**
 * Component factory function
 *
 * @param  {Object} app  current application context
 * @return {Object}      component instances
 */
module.exports = function (app) {
	return new Master(app);
};

/**
* Master component class
* 
* @param {Object} app  current application context
*/
var Master = function (app) {
	this.app = app;
};

var pro = Master.prototype;

/**
 * Component lifecycle function
 * 
 * @param  {Function} cb 
 * @return {Void}      
 */
pro.start = function (cb) {
	listen(this.app);
        utils.invokeCallback(cb);
};

/**
 * Component lifecycle function
 * 
 * @param  {Boolean}   force whether stop the component immediately 
 * @param  {Function}  cb    
 * @return {Void}         
 */
pro.stop = function (force, cb) {
	utils.invokeCallback(cb);
};

/**
 * Listen the master server
 * 
 * @param {Object} app current application context
 * @return {Void}
 */
var listen = function (app) {
	var master = app.master;
	app.set('serverId', master.id);
	var serverInst = require('../master/server.js');
	serverInst.listen(master);
	app.set('currentServer', serverInst);
};
