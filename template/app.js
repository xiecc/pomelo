/**
 * Module dependencies.
 */
var pomelo = require('pomelo')

var appTemplate = pomelo.appTemplate;
var app = appTemplate.init();

// Configuration
app.set('name', '$');
app.set('dirname', __dirname);
appTemplate.defaultConfig(app);

// Start
app.start();

function startWebServer() {
    var app_express = require('./app_express');
    console.log('[AppWebServerStart] listen, visit http://0.0.0.0:3001/index.html');
}

if (app.serverType === 'master') {
    startWebServer();
}
