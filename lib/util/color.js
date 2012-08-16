var util = require('util');

var log = {};

module.exports = log;


log.log = function () {
    util.puts([].join.call(arguments, ' '));
};


log.beauty = function(prefix,buf,level) {
  level = level || 'green';
  var out =  prefix + ' ' + buf
      .toString()
      .replace(/\s+$/, '')
      .replace(/\n/g, '\n' + prefix);
  return this.$(out)[level];
}


//Stylize a string
log.stylize = function(str, style) {
    var styles = {
        'bold'      : [1,  22],
        'italic'    : [3,  23],
        'underline' : [4,  24],
        'cyan'      : [96, 39],
        'blue'      : [34, 39],
        'yellow'    : [33, 39],
        'green'     : [32, 39],
        'red'       : [31, 39],
        'grey'      : [90, 39],
        'green-hi'  : [92, 32],
    };
    return '\033[' + styles[style][0] + 'm' + str + '\033[' + styles[style][1] + 'm';
};

log.$ = function(str) {
    var self = this;
    str = new(String)(str);
    ['bold', 'grey', 'yellow', 'red', 'green', 'cyan', 'blue', 'italic', 'underline'].forEach(function (style) {
        Object.defineProperty(str, style, {
            get: function () {
                return self.$(self.stylize(this, style));
            }
        });
    });
    return str;
};

