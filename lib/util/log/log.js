var logger = require('pomelo-logger');

module.exports.configure = function(app, filename) {
	var serverId = app.get('serverId');
	var serverType = app.get('serverType');
	logger.configure(filename, {serverId: serverId, pattern: serverType});
};

module.exports.getLogger = function(categoryName) {
	return logger.getLogger(categoryName);
};