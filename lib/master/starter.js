var cp = require('child_process');
var logger = require('pomelo-logger').getLogger();
var starter = module.exports;
var util = require('util');
var ENV = "production";


/**
 * Run all servers
 *
 * @param {Object} app current application  context
 * @return {Void}
 */
starter.runServers = function (app) {
	var servers = app.serverMap;
	for (var serverId in servers) {
		this.run(app, servers[serverId]);
	}
};

/**
 * Run server
 * 
 * @param {Object} app current application context
 * @param {Object} server
 * @return {Void}
 */
starter.run = function (app, server) {
	var cmd = util.format('cd %s && node ', app.getBase());
	var arg = server.args;
	if (arg !== undefined) {
		cmd += arg;
	}
	this.env = app.env;
	cmd+=util.format(' %s env=%s serverType=%s serverId=%s', app.main, app.env, server.serverType, server.id);
	if (isLocal(server.host)) {
		starter.localrun(cmd);
	} else {
		starter.sshrun(cmd, server.host);
	}
};

var isLocal = function(host) {
	return host === '127.0.0.1' || host === 'localhost';
}

/**
 * Kill application in all servers
 *
 * @param {String} pids  array of server's pid
 * @param {String} serverIds array of serverId
 * @memberOf Application
 */
starter.kill = function(app, pids, serverIds) {
    for(var i = 0; i < serverIds.length; i++) {
        var server = app.getServerById(serverIds[i]);
        if(!server) continue;
        var cmd = util.format('kill -9 %s', pids[i]);
        if(isLocal(server.host)) starter.localrun(cmd);
        else starter.sshrun(cmd, server.host);
    }
};

/**
 * Use ssh to run command.
 *
 * @param {String} cmd
 * @param {String} host 
 * @param {Callback} callback
 *
 */
starter.sshrun = function (cmd, host, callback) {
    logger.info('Executing ' + cmd + ' on ' + host);
    data = [];
    spawnProcess('ssh', [host, cmd], function (err, out) {
            if (!err) {
                data.push({
                    host:host,
                    out:out
                });
            }
            done(err);
        });
    var error;
    function done(err) {
        error = error || err;
            if (error) {
                starter.abort('FAILED TO RUN, return code: ' + error);
            } else if (callback) {
                callback(data);
            }
    }
};

/**
 * Run local command.
 * 
 * @param {String} cmd
 * @param {Callback} callback
 *
 */
starter.localrun = function (cmd, callback) {
    logger.info('Executing ' + cmd + ' locally');
    spawnProcess(cmd, ['', ''], function (err, data) {
        if (err) {
            starter.abort('FAILED TO RUN, return code: ' + err);
        } else {
            if (callback) callback(data);
        }
    });
};

/**
 * Fork child process to run command.
 *
 * @param {String} command
 * @param {Object} options
 * @param {Callback} callback
 *
 */
function spawnProcess(command, options, callback) {
    var self = starter;
	  var child;
    if (!!options[0]) {
        child = cp.spawn(command, options);
    } 
    else {
        child = cp.exec(command, options);
    }

    var prefix = command === 'ssh' ? '[' + options[0] + '] ' : '';
    child.stderr.on('data', function (chunk) {
				var msg = prefix + chunk.toString();
        logger.error(msg);
    });

		var res = [];
		if (this.env!==ENV) {
			child.stdout.on('data', function (chunk) {
					var msg = prefix + chunk.toString();
					res.push(msg);
					logger.info(msg);
					}); 
		}

    child.on('exit', function (code) {
        if (!!callback) {
            callback(code === 0 ? null : code, res && res.join('\n'));
        }
    });
};

/**
 * Stop process.
 * 
 * @param {String} msg
 *
 */
starter.abort = function (msg) {
    logger.error(msg);
    process.exit(1);
};
