var sessionService = require('../../lib/common/service/sessionService');
var sio = require('socket.io');
var io = require('socket.io-client');
var should = require('should');
var async = require('async');

var port = 3006;
var WAIT_TIME = 100;

describe('sessionServiceTest', function(){
    var session;
    before(function(){
        
        var wsocket = sio.listen(port);
        wsocket.set('log level', 1);
        wsocket.sockets.on('connection', function (socket) {
            session = sessionService.createSession({
                key: socket.id,
                socket: socket
            });
            socket.on('disconnect',function(){
            });
        });

    });
    
    it('should create sessionService and send msg ok',function(done){
        var socket = io.connect('http://localhost:' + port);
        sessionService.sendDirectly = true;

        socket.on('connect',function(){
            should.exist(session);
            var curSession = sessionService.getSession(session.key);
            should.equal(session.key,curSession.key);
            should.exist(curSession);
            sessionService.sendMessage(curSession.key,{msg:"hello"});

            socket.on('message',function(msg){
                should.exist(msg);
                socket.disconnect();
                done();
            });
        });
    });
    
});

