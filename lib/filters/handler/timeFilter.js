/**
 * Filter for statistics.
 * Record used time for each request.
 */
var utils = require('../../util/utils');
var con_logger = require('../../util/log/log').getLogger('con-log');
var filter = module.exports;

filter.before = function(msg, session, next) {
  session.__startTime__ = Date.now();
  next();
};

<<<<<<< HEAD:lib/filters/timeFilter.js
filter.after = function(err,msg, session,opts,next) {
  var start = utils.format(new Date(session.__startTime__));
=======
filter.after = function(err, msg, session, resp, next) {
  var start = utils.format(session.__startTime__);
>>>>>>> 2ed60bee541fb3d9c4fe8f397b7505061bb41a89:lib/filters/handler/timeFilter.js
  if(typeof start === 'number') {
    var timeUsed = Date.now() - start;
    //con_logger.info([msg.route, msg,start, timeUsed].join(' '));
    var log = {
      route : msg.route,
      args : msg,
      time : start,
      timeUsed : timeUsed
  };
  con_logger.info(JSON.stringify(log));
  }
  next(err,msg);
  //console.log(arguments);
};
