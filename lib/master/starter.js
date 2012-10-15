var cp = require('child_process');
var logger = require('log4js').getLogger();
var starter = module.exports;

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
starter.run = function (cmd, callback) {
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
    child.stdout.on('data', function (chunk) {
				var msg = prefix + chunk.toString();
        res.push(msg);
        logger.info(msg);
    });

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
