var cp = require('child_process');
var color = require('../util/color');

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
    var hosts = [host];
    color.log('Executing ' + color.$(cmd).yellow + ' on ' + color.$(hosts.join(', ')).blue);
    var wait = 0;
    data = [];

    if (hosts.length > 1) {
        parallelRunning = true;
    }

    hosts.forEach(function (host) {
        wait += 1;
        spawnProcess('ssh', [host, cmd], function (err, out) {
            if (!err) {
                data.push({
                    host:host,
                    out:out
                });
            }
            done(err);
        });
    });

    var error;

    function done(err) {
        error = error || err;
        if (--wait === 0) {
            starter.parallelRunning = false;
            if (error) {
                starter.abort('FAILED TO RUN, return code: ' + error);
            } else if (callback) {
                callback(data);
            }
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
    color.log('Executing ' + color.$(cmd).green + ' locally');
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
    var child = null;
    if (!!options[0]) {
        child = cp.spawn(command, options);

    } else {
        child = cp.exec(command, options);
    }

    var prefix = command === 'ssh' ? '[' + options[0] + '] ' : '';

    child.stderr.on('data', function (chunk) {
        color.log(color.beauty(prefix, chunk, 'red'));
    });

    var res = [];
    child.stdout.on('data', function (chunk) {
        res.push(chunk.toString());
        color.log(color.beauty(prefix, chunk));
    });`

    child.on('exit', function (code) {
        if (callback) {
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
    color.log(color.$(msg).red);
    process.exit(1);
};
