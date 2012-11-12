var mockSessionService = require('../../lib/common/service/mockSessionService');
var should = require('should');

describe('mockSessionServiceTest', function(){
	it('session create should be ok!', function(done){
		var session = mockSessionService.createSession({uid:1001, key: 'xcc123go'});
		session.bind(1001).should.not.be.ok;

		var expSession = session.exportSession();

		should.equal(expSession.uid, session.uid);
		done();
	});
});

