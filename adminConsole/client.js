/*!
 * Pomelo -- adminConsole webClient 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */

(function(window){

	var client = function(clientId){
		this.id = clientId;
		this.reqId = 1;
	}

	client.prototype = {
		connect : function(host,port,cb){
			var self = this;
			var socket = this.socket = io.connect('http://'+host+':'+port);
			socket.on('connect',function(){
				socket.emit('register',{type:"client",serverId:self.id});
				console.log('socket.io connected');
				cb();
			});
		},

		request : function(moduleId,msg,cb){
			var self = this;
			msg.monitorId = msg.monitorId || 'all';
			var req = protocol.composeRequest(self.reqId++,moduleId,msg);
			
			self.socket.emit('client',req);
			self.socket.on('client',function(_msg){
				cb(null,_msg);
			})
		}

	}

	window.consoleClient = client;
})(window);
