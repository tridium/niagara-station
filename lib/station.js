/*jshint node: true */
"use strict";

require('colors');

var extend = require('node.extend'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    ncp = require('ncp'),
    path = require('path'),
    _ = require('underscore'),
    noop = function () {},

    bogUtils = require('./bog-utils'),
    parseBog = bogUtils.parseBog;

var defaults = {
  cwd: path.join(process.env.NIAGARA_HOME, 'bin'),
  stationsDir: path.join(process.env.NIAGARA_USER_HOME, 'stations'),
  command: 'station',
  systemProperties: null,
  stationName: 'node',
  startedString: 'niagara>',
  sourceStationFolder: undefined,
  forceCopy: false,

  logLevel: 'WARNING',

  log: function (msg, logLevel, pkg) {
    var str = 'station ' + this.stationName + ': ' + msg;
    switch (logLevel) {
      case 'SEVERE':
        return console.log(str.red);
      case 'WARNING':
        return console.log(str.yellow);
      case 'INFO':
        return console.log(str.green);
      default:
        return console.log(str.grey);
    }
  }
};

var DEFAULT_BOG_OVERRIDES = {
  httpPort: '/Services/WebService',
  httpsPort: '/Services/WebService',
  foxPort: '/Drivers/NiagaraNetwork/foxService',
  foxsPort: '/Drivers/NiagaraNetwork/foxService'
};

var LOGGING_LEVELS = [
  'NONE',
  'SEVERE',
  'WARNING',
  'INFO',
  'CONFIG',
  'FINE',
  'FINER',
  'FINEST',
  'ALL'
];

var LOG_LEVEL_REGEX = new RegExp('^(' + LOGGING_LEVELS.join('|') + ') \\[[^\\]]+\\]\\[([^\\]]+)\\]');
var NEWLINE_REGEX = /\r?\n/;

var ALL_LOG_THRESHOLD = LOGGING_LEVELS.indexOf('ALL');

function toSystemProperties(props) {
  return _.map(props || {}, function (value, key) {
    return '-@D' + key + '=' + value;
  }).join(' ');
}

function toJvmArgs(args) {
  return _.map(args || [], function (arg) {
    return arg.replace(/^-/, '-@');
  }).join(' ');
}

/**
 * Representation of a Niagara station process. Allows the station to be
 * started and stopped and queried for certain data points.
 *
 * @param {Object} [config] station configuration object
 * @param {String} [config.cwd=NIAGARA_HOME/bin] the directory containing the
 * station process
 * @param {String} [config.stationsDir=NIAGARA_USER_HOME/stations] the directory
 * containing Niagara stations
 * @param {String} [config.command=station] the name of the station executable
 * @param {String} [config.stationName=node] the name of the Niagara station
 * to start
 * @param {Boolean} [config.forceCopy=false] true if you want to force the
 * source station folder to be copied into rel/stations, overwriting any
 * existing station
 * @param {String} [config.sourceStationFolder] the folder containing the
 * station files to copy into rel/stations (leave undefined if you know the
 * station already exists)
 * @param {String} [config.logLevel='NONE'] the desired java.util.logging log level -
 * log messages of a lower severity than this will not be output to the
 * console. Available values are `NONE`, `SEVERE`, `WARNING`, `INFO`, `CONFIG`,
 * `FINE`, `FINER`, `FINEST`, and `ALL`.
 * @param {Function} [config.log] a function to log stdout from the station
 * process
 * @param {Object} [config.bogOverrides] values to inject into the station
 * bog file before startup
 * @param {Number} [config.bogOverrides.httpPort] HTTP port for the station web
 * server
 * @param {Number} [config.bogOverrides.httpsPort] HTTPS port for the station web
 * server
 * @param {Number} [config.bogOverrides.foxPort] FOX port for the station FOX
 * service
 * @param {Number} [config.bogOverrides.foxsPort] FOXS port for the station FOX
 * service
 * @param {Array.<String>} [config.jvmArgs] a list of additional
 * @param {Object} [config.systemProperties] a mapping from Java System Property
 * to value, to be passed to the station.exe command
 * @constructor
 */
function Station(config) {
  config = extend({}, defaults, config);
  /**
   * folder the station will actually execute from
   * @private
   * @type {String}
   */
  this.$homeFolder = path.join(config.stationsDir, config.stationName);
  /**
   * Path to the station bog file
   * @private
   * @type {String}
   */
  this.$bogFilePath = path.join(this.$homeFolder, 'config.bog');
  /**
   * config object from constructor
   * @private
   * @type {Object}
   */
  this.$config = config;
}

/**
 * Start up the station process.
 * @param {Function} cb callback when station is started
 */
Station.prototype.start = function (cb) {
  var that = this,
      process,
      config = that.$config,
      bogFile = that.$bogFilePath,
      bogOverrides = config.bogOverrides,
      cmd = config.cwd + path.sep + config.command,
      systemProperties = toSystemProperties(config.systemProperties),
      jvmArgs = toJvmArgs(config.jvmArgs),
      stationName = config.stationName,
      started = false,
      maxLogLevel = LOGGING_LEVELS.indexOf(String(config.logLevel).toUpperCase());
  
  function doStart() {
    function checkForStart(s) {
      if (s.indexOf(config.startedString) >= 0 && !started) {
        started = true;
        cb(null);
      }
    }

    function doLog(str) {
      var lines = str.split(NEWLINE_REGEX);
      
      lines.forEach(function (str) {
        if (!str) {
          return;
        }
        var results = LOG_LEVEL_REGEX.exec(str),
            logLevel = results && results[1], //INFO
            pkg = results && results[2],
            idx = LOGGING_LEVELS.indexOf(logLevel);

        if ((idx >= 0 && idx <= maxLogLevel) || maxLogLevel === ALL_LOG_THRESHOLD) {
          config.log(str, logLevel, pkg);
        }
      });
    }

    process = spawn(cmd, [ stationName, systemProperties, jvmArgs ], config);

    process.stdout.on('data', function (data) {
      var s = String(data);
      doLog(s);
      checkForStart(s);
    });

    process.stderr.on('data', function (data) {
      var s = String(data);
      doLog(s);
      checkForStart(s);
    });

    process.on('exit', function (code) {
      doLog('exited with code ' + code);
    });

    that.$process = process;
  }

  if (bogOverrides) {
    parseBog(bogFile, function (err, bog) {
      if (err) {
        return cb(err);
      }
      Station.$applyBogOverrides(bog, bogOverrides);
      bog.save(bogFile, function (err) {
        if (err) {
          return cb(err);
        }
        doStart();
      });
    });
  } else {
    doStart();
  }
};

/**
 * Applies any bog overrides passed into the station constructor to the
 * given bog file.
 * @param {Bog} bog
 * @param {Object} bogOverrides
 * @private
 */
Station.$applyBogOverrides = function (bog, bogOverrides) {
  var prop, path;

  for (prop in bogOverrides) {
    if (bogOverrides.hasOwnProperty(prop)) {
      path = DEFAULT_BOG_OVERRIDES[prop];
      bog.addNode(path, prop, 'b:ServerPort');
      bog.setValue(path + '/' + prop + '/publicServerPort', bogOverrides[prop]);
    }
  }
};

Station.prototype.$doCommand = function (command, listenFor, cb) {
  var process = this.$process,
      onData;

  if (listenFor && (typeof cb === 'function')) {
    
    onData = function (data) {
      var str = String(data);
      if (str.indexOf(listenFor) >= 0) {
        cb(null, str);
        process.stdout.removeListener('data', onData);
      }
    };

    process.stdout.on('data', onData);
  }
  
  process.stdin.write(command + '\n');
};

/**
 * Asks the station process for version information.
 * @param {Function} cb callback to accept version information when it is
 * returned from the station process
 */
Station.prototype.version = function (cb) {
  this.$doCommand('version', 'Niagara Runtime Environment', cb);
};

/**
 * Asks the station process to shutdown nicely.
 * @param {Function} cb callback when the station process has exited
 */
Station.prototype.quit = function (cb) {
  var process = this.$process;
  
  process.stdin.write('quit\n');
  process.once('exit', cb || noop);
};

/**
 * Asks the station to save its BOG file.
 * @param {Function} cb callback when station process has saved
 */
Station.prototype.save = function (cb) {
  this.$doCommand('save', 'Saved', cb);
};

/**
 * Asks the station process to shutdown not-so-nicely. Starts by sending the
 * station a "kill" command and resorting to hard-killing the process if it
 * hasn't ended by the timeout.
 *
 * @param {Function} cb callback when the station has been killed
 * @param {Number} [timeout=5000] time in milliseconds to wait before kill -9ing
 */
Station.prototype.kill = function (cb, timeout) {
  cb = cb || noop;

  var that = this,
      process = that.$process,
      killed = false;
  
  process.stdin.write('kill\n');
  process.once('exit', function () {
    killed = true;
    cb();
  });

  //kill it extra dead
  setTimeout(function () {
    if (!killed) {
      console.error("Station failed to shutdown. Killing station process...");
      process.kill();
      cb("Station was terminated impolitely.");
    }
  }, timeout || 5000);
};

function ensureStationFolderExists(config, cb) {
  var stationsDir = config.stationsDir,
      stationName = config.stationName,
      sourceStationFolder = config.sourceStationFolder,
      destStationFolder = path.join(stationsDir, stationName);

  function doStationCopy() {
    if (!sourceStationFolder) {
      return cb("The test station does not exist, and no default station is specified to copy.");
    }

    console.log('Copying test station from: ' + sourceStationFolder);
    console.log('                       to: ' + destStationFolder);

    ncp(sourceStationFolder, destStationFolder, function (err) {
      if (err) {
        console.error("Failed to copy test station to niagara.");
        return cb(err);
      }

      cb(null);
    });
  }

  fs.exists(stationsDir, function (exists) {
    if (!exists) {
      return cb('The stations directory ' + stationsDir + ' does not exist');
    }

    if (config.forceCopy || !fs.existsSync(destStationFolder)) {
      doStationCopy();
    } else {
      cb(null);
    }
  });
}

/**
 * Copies the station into rel/stations, if necessary, and starts it up.
 *
 * @param {Object} [config] configuration object (will also be passed to
 * Station instance)
 * @param {Boolean} [config.forceCopy=false] set to true if you always want to
 * copy the station folder into /rel/stations, overwriting any existing station
 * (will error if `sourceStationFolder` is not also defined). If false, the
 * copy will only occur if the station does not already exist in rel/stations.
 * @param {Function} cb callback when copy is complete and station is started.
 * Station instance will be second argument.
 */
Station.copyAndRun = function copyAndRun(config, cb) {
  if (typeof cb !== 'function') {
    throw new Error("callback function required");
  }

  config = extend({}, defaults, config);

  ensureStationFolderExists(config, function (err) {
    if (err) {
      return cb(err);
    }

    var station = new Station(config);
    station.start(function (err) {
      cb(err, station);
    });
  });
};

module.exports = Station;
