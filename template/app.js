var pomelo = require('pomelo');
var appTemplate = pomelo.appTemplate;
var RPC_FLUSH_INTERVAL = 30;
var app = appTemplate.init();

app.set('name', '$');
app.set('dirname', __dirname);
appTemplate.defaultConfig(app);

app.configure('production|development', function () {
    if (app.serverType !== 'master') {
        app.load(pomelo.remote, {cacheMsg:true, interval:RPC_FLUSH_INTERVAL});
    }
});

appTemplate.done(app);

app.start();

function startWebServer() {
    var app_express = require('./app_express');
    console.log('[AppWebServerStart] listen, visit http://0.0.0.0:3001/index.html');
}

if (app.serverType === 'master') {
    startWebServer();
    app.startConsole();
}

process.on('uncaughtException', function (err) {
    console.error(' Caught exception: ' + err.stack);
});
