var app = require('../lib/application');
var should = require('should');

var WAIT_TIME = 100;
var mockBase = process.cwd() + '/test';

describe('application test', function(){
	afterEach(function() {
		app.state = 0;
		app.settings = {};
	});

	describe('#init', function() {
		it('should init the app instance', function() {
			app.init({base: mockBase});
			app.state.should.equal(1);  // magic number from application.js
		});
	});

	describe('#set and get', function() {
		it('should play the role of normal set and get', function() {
			should.not.exist(app.get('some undefined key'));

			var key = 'some defined key', value = 'some value';
			app.set(key, value);
			value.should.equal(app.get(key));
		});

		it('should return the value if pass just one parameter to the set method', function() {
			var key = 'some defined key', value = 'some value';
			should.not.exist(app.set(key));
			app.set(key, value);
			value.should.equal(app.set(key));
		});
	});

	describe("#enable and disable", function() {
		it('should play the role of enable and disable', function() {
			var key = 'some enable key';
			app.enabled(key).should.be.false;
			app.disabled(key).should.be.true;

			app.enable(key);
			app.enabled(key).should.be.true;
			app.disabled(key).should.be.false;

			app.disable(key);
			app.enabled(key).should.be.false;
			app.disabled(key).should.be.true;
		});
	});

	describe("#compoent", function() {
		it('should load the component and fire their lifecircle callback by app.start, app.afterStart, app.stop', function(done) {
			var startCount = 0, afterStartCount = 0, stopCount = 0;

			var mockComponent = {
				start: function(cb) {
					startCount++;
					cb();
				}, 

				afterStart: function(cb) {
					afterStartCount++;
					cb();
				}, 

				stop: function(force, cb) {
					stopCount++;
					cb();
				}
			};

			app.init({base: mockBase});
			app.defaultConfiguration();
			app.load(mockComponent);
			app.start(function(err) {
				should.not.exist(err);
			});

			setTimeout(function() {
				// wait for after start
				app.stop(false);

				setTimeout(function() {
					// wait for stop
					startCount.should.equal(1);
					afterStartCount.should.equal(1);
					stopCount.should.equal(1);
					done();
				}, WAIT_TIME);
			}, WAIT_TIME);
		});

		it('should access the component with a name by app.components.name after loaded', function() {
			var key1 = 'key1', comp1 = {content: 'some thing in comp1'};
			var comp2 = {name: 'key2', content: 'some thing in comp2'};
			var key3 = 'key3';
			var comp3 = function() {
				return {content: 'some thing in comp3', name: key3};
			};

			app.init({base: mockBase});
			app.load(key1, comp1);
			app.load(comp2);
			app.load(comp3);

			app.components.key1.should.eql(comp1);
			app.components.key2.should.eql(comp2);
			app.components.key3.should.eql(comp3());
		});
	});

	describe('#configure', function() {
		it('should execute the code block wtih the right environment', function() {
			var proCount = 0, devCount = 0;
			var proEnv = 'production', devEnv = 'development', serverType = 'server';

			app.init({base: mockBase});
			app.set('serverType', serverType);
			app.set('env', proEnv);

			app.configure(proEnv, serverType, function() {
				proCount++;
			});

			app.configure(devEnv, serverType, function() {
				devCount++;
			});

			app.set('env', devEnv);

			app.configure(proEnv, serverType, function() {
				proCount++;
			});

			app.configure(devEnv, serverType, function() {
				devCount++;
			});

			proCount.should.equal(1);
			devCount.should.equal(1);
		});

		it('should execute the code block wtih the right server', function() {
			var server1Count = 0, server2Count = 0;
			var proEnv = 'production', serverType1 = 'server1', serverType2 = 'server2';

			app.init({base: mockBase});
			app.set('serverType', serverType1);
			app.set('env', proEnv);

			app.configure(proEnv, serverType1, function() {
				server1Count++;
			});

			app.configure(proEnv, serverType2, function() {
				server2Count++;
			});

			app.set('serverType', serverType2);

			app.configure(proEnv, serverType1, function() {
				server1Count++;
			});

			app.configure(proEnv, serverType2, function() {
				server2Count++;
			});

			server1Count.should.equal(1);
			server2Count.should.equal(1);
		});
	});
});
