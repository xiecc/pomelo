var ConnectionService = require('../common/service/connectionService');

module.exports = function(app) {
	return new Component(app);
};

module.name = 'connection';

var Component = function(app) {
	this.app = app;
	this.service = new ConnectionService();

	// proxy the service methods except the lifecycle interfaces of component
	var method;
	for(var m in this.service) {
		if(this.service.hasOwnProperty(m) && (m !== 'start' && m !== 'stop')) {
			method = this.service[m];
			if(typeof method === 'function') {
				this[m] = method;
			}
		}
	}
};
