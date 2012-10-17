/**
 * Filter for timeout. 
 * Print a warn information when request timeout.
 */
var logger = require('../../util/log/log').getLogger(__filename);

var DEFAULT_TIMEOUT = 3000;

module.exports = function(timeout) {
  return new Filter(timeout || DEFAULT_TIMEOUT);
};

var Filter = function(timeout) {
  this.timeout = timeout;
};

Filter.prototype.before = function(msg, session, next) {
  session.__timeout__ = setTimeout(function() {
    logger.warn('request %j timeout.', msg.route);
  }, this.timeout);
  next();
};

Filter.prototype.after = function(err, msg, session, resp, next) {
  var timeout = session.__timeout__;
  if(timeout) {
    clearTimeout(timeout);
  }
  next(err,msg);
};
