niagara-station
===============

A node wrapper around a Niagara station process.

Example
-------

    //these are the defaults, result is the same as just passing {}
    var config = {
      cwd: 'd:\\niagara\\r40\\niagara_home\\bin',
      command: 'station',
      stationName: 'node',
      startedString: 'niagara>'
    };
    
    require('niagara-station')(config, function (err, station) {
      if (err) {
        return;
      }
      
      console.log('station started.');
      
      // do things with station...
      
      station.quit(function () {
        console.log('station quit.');
      });
    });

`config.cwd` (default: `NIAGARA_HOME/bin`) directory where station.exe lives

`config.stationsDir` (default: `NIAGARA_USER_HOME/stations`) directory where
station files live

`config.command` (default: `'station'`) command to execute

`config.stationName` (default: `'node'`) name of station to start

`config.forceCopy` (default: `false`) set to true if you want to force copying
 a station folder to NIAGARA_HOME before starting the station (for starting up
 a fresh station during unit tests, for example)

`config.sourceStationFolder` (required if `forceCopy` is `true`) the location
of the station to copy

`config.startedString` (default: `'niagara>'`) the string the station will
emit to indicate it has finished startup

`config.logLevel` (default: `'WARNING'`) the logging level to capture from the
 station and output to the console. Available values are `NONE`, `SEVERE`,
 `WARNING`, `INFO`, `CONFIG`, `FINE`, `FINER`, `FINEST`, and `ALL`. Note that
 `ALL` is required to capture messages without a logging level (direct
 `System.out.println()` calls, for instance).
 
`config.log` function to log console info from station (messages with a log
level of 'INFO' or finer')

`config.err` function to log error info from station (messages with a log
level or 'WARNING' or coarser)