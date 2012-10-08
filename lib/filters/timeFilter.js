/**
 * Filter for statistics.
 * Record used time for each request.
 */
var utils = require('../util/utils');
var con_logger = require('../util/log/log').getLogger('con-log');
var filter = module.exports;

filter.before = function(msg, session, next) {
  session.__startTime__ = Date.now();
  next();
};

filter.after = function(err, msg, session, next) {
  var start = session.__startTime__;
  if(typeof start === 'number') {
    var timeUsed = Date.now() - start;
    con_logger.info([msg.route, msg,start, timeUsed].join(' '));
  }
  next(err, resp);
};
