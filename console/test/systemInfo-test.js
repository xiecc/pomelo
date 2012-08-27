 var io = require('socket.io-client');

 var socket = io.connect("http://localhost:8001");
 console.log("client listen on master on port 8001");
	
 socket.on('connect',function(){
	socket.emit('message',{serverType:"client",dataSource:"master",moduleId:"systemInfo"});
 });

 socket.on('systemInfo',function(msg){
 	console.log("------------get systemInfo ------------");
 	console.log(msg);
 });