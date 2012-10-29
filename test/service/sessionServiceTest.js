var sessionService = require('../../lib/common/service/sessionService');
var sio = require('socket.io');
var io = require('socket.io-client');
var should = require('should');
var async = require('async');

var port = 3006;
var WAIT_TIME = 100;
var status;
var uid = 123;

describe('#sessionServiceTest', function(){
    var session;
    var wsocket;
    before(function(){
        wsocket = sio.listen(port);
        wsocket.set('log level', 1);
        wsocket.sockets.on('connection', function (socket) {
            session = sessionService.createSession({
                key: socket.id,
                socket: socket
            });
            session.bind(uid);
            socket.on('disconnect',function(){
                status = 'disconnect';
            });
        });
    });

    after(function(){
        wsocket.server.close();
    });
    
    it('should create sessionService and send msg ok',function(done){
        var socket = io.connect('http://localhost:' + port, {'force new connection': true} );
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

    it('should flush msg to client ok',function(done){
        var socket = io.connect('http://localhost:' + port, {'force new connection': true});
        sessionService.sendDirectly = false;

        socket.on('connect',function(){
            should.exist(session);
            var curSession = sessionService.getSession(session.key);
            should.exist(curSession);
            sessionService.sendMessage(curSession.key,{msg:"hello"});
            sessionService.sendMessage(curSession.key,{msg:"pomelo"});
            sessionService.flush();

            socket.on('message',function(msg){
                should.exist(msg);
                socket.disconnect();
                done();
            });
        });
    });
    
    it('should bind uid and kick user ok',function(done){
        var socket = io.connect('http://localhost:' + port , {'force new connection': true});

        socket.on('connect',function(){
            var curSession = sessionService.getSessionByUid(uid);
            should.exist(curSession);

            sessionService.kick(uid,function(){
                should.equal(status,"disconnect");
                done();
            });          
        });
    });

});

