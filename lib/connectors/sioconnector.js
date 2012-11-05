var util = require('util');
var EventEmitter = require('events').EventEmitter;
var sio = require('socket.io');
var SioSocket = require('./siosocket');

var curId = 1;

var Connector = function(port, host) {
	EventEmitter.call(this);
	this.port = port;
	this.host = host;
};

util.inherits(Connector, EventEmitter);

module.exports = Connector;

Connector.prototype.start = function() {
	var self = this;
	this.wsocket = sio.listen(this.port);
	this.wsocket.set('log level', 1);
	this.wsocket.sockets.on('connection', function (socket) {
		self.emit('connection', new SioSocket(curId++, socket));
	});
};

Connector.prototype.stop = function() {
	this.wsocket.server.close();
};
