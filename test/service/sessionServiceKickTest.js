var sessionService = require('../../lib/common/service/sessionService');
var sio = require('socket.io');
var io = require('socket.io-client');
var should = require('should');
var async = require('async');

var port = 3006;
var WAIT_TIME = 100;
var status;
var uid = 123;

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
            session.bind(uid);
            socket.on('disconnect',function(){
                status = 'disconnect';
            });
        });

    });
    
    it('should bind uid and kick user ok',function(done){
        var socket = io.connect('http://localhost:' + port);

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

