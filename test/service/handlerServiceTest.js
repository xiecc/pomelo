var should = require('should');
var HandlerService = require('../../lib/common/service/handlerService');

var mockApp = {
	serverType: 'connector', 

	get: function(key) {
		return this[key];
	}
};

var mockSession = {
	exportSession: function() {
		return this;
	}
};

var mockMsg = {route: 'connector.testHandler.testMethod', body: {key: 'some request message'}};

describe('handler service test', function() {
	describe('handle', function() {
		it('should dispatch the request to the handler if the route match current server type', function(done) {
			var invoke1Count = 0, invoke2Count = 0;
			// mock datas
			var mockHandlers = {
				testHandler: {
					testMethod: function(msg, session, next) {
						invoke1Count++;
						msg.should.eql(mockMsg.body);
						next();
					}
				}, 
				test2Handler: {
					testMethod: function(msg, session, next) {
						invoke2Count++;
						next();
					}
				}
			};

			var service = new HandlerService(mockApp, mockHandlers);

			service.handle(mockMsg, mockSession, function() {
				invoke1Count.should.equal(1);
				invoke2Count.should.equal(0);
				done();
			});
		});

		it('should dispatch the request to the remote server if the route not match current server type', function(done) {
			var invokeCount = 0, invoke2Count = 0;
			
			// mock datas
			var mockApp = {
				serverType: 'area', 

				get: function(key) {
					return this[key];
				}, 

				sysrpc: {
					connector: {
						msgRemote: {
							forwardMessage: function(session, msg, expSession, cb) {
								invokeCount++;
								session.should.eql(mockSession);
								msg.should.eql(mockMsg);
								expSession.should.eql(mockSession);
								cb();
							}
						}
					}
				}
			};

			var service = new HandlerService(mockApp);

			service.handle(mockMsg, mockSession, function() {
				invokeCount.should.equal(1);
				done();
			});
		});

		it('should return an error if can not find the appropriate handler locally', function(done) {
			var mockHandlers = {};
			var service = new HandlerService(mockApp, mockHandlers);

			service.handle(mockMsg, mockSession, function(err) {
				should.exist(err);
				done();
			});
		});
	});
});