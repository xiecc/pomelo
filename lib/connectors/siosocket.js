var util = require('util');
var EventEmitter = require('events').EventEmitter;
var protocol = require('pomelo-protocol');

var Socket = function(id, socket) {
	EventEmitter.call(this);
	this.id = id;
	this.socket = socket;
	this.remoteAddress = {
		ip: socket.handshake.address.address, 
		port: socket.handshake.address.port
	};

	var self = this;

	socket.on('disconnect', this.emit.bind(this, 'disconnect'));

	socket.on('error', this.emit.bind(this, 'error'));

	socket.on('message', function(msg) {
		if(msg) {
			msg = protocol.decode(msg);
		}

		self.emit('message', msg);
	});

	// TODO: any other events?
};

util.inherits(Socket, EventEmitter);

module.exports = Socket;

Socket.prototype.send = function(msg) {
	if(typeof msg !== 'string') {
		msg = JSON.stringify(msg);
	}
	this.socket.send(msg);
};