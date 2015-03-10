niagara-station
===============

A node wrapper around a Niagara station process.

## Example

```javascript
// These are the defaults, result is the same as just passing {}
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
  
  // Do things with station...
  
  station.quit(function () {
    console.log('station quit.');
  });
});
```

##### `config.cwd`
Type:   `string`
Default value: `'NIAGARA_HOME/bin'`

Directory where `station.exe` lives.

##### `config.stationsDir`
Type:   `string`
Default value: `'NIAGARA_USER_HOME/stations'`

Directory where station files live.

##### `config.command`
Type:   `string`
Default value: `'station'`

Command to execute.

##### `config.stationName`
Type:   `string`
Default value: `'node'`

Name of station to start.

##### `config.forceCopy`
Type:   `boolean`
Default value: `false`

Set to true if you want to force copying a station folder to `NIAGARA_HOME` before starting the station (for starting up a fresh station during unit tests, for example).

##### `config.sourceStationFolder`

Required if `forceCopy` is `true`.
The location of the station to copy.

##### `config.startedString`
Type:   `string`
Default value: `'niagara>'`

The string the station will emit to indicate it has finished startup.

##### `config.logLevel`
Type:   `string`
Default value: `'WARNING'`

The logging level to capture from the station and output to the console. Available values are `NONE`, `SEVERE`, `WARNING`, `INFO`, `CONFIG`, `FINE`, `FINER`, `FINEST`, and `ALL`. Note that `ALL` is required to capture messages without a logging level (direct `System.out.println()` calls, for instance).
 
##### `config.log(string msg, string [level])`

| Name    | Type   | Description                                    |
|---------|--------|------------------------------------------------|
| msg     | string | Message.                                       |
| [level] | string | Log level (optional). Default value at `INFO`. |

Function to log console info from station (messages with a log level of `INFO` or finer).

##### `config.err(string msg, string [level])`

| Name    | Type   | Description                                    |
|---------|--------|------------------------------------------------|
| msg     | string | Message.                                       |
| [level] | string | Log level (optional). Default value at `INFO`. |

Function to log error info from station (messages with a log level or `WARNING` or coarser).
