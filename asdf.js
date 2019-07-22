var Station = require('./lib/station');
var station = new Station({
  stationName: 'webEditors',
  systemProperties: {
    foo: 'bar',
    baz: 'buzz'
  }
});
station.start(function (err) {
  if (err) { console.error(err); }
  else { console.log('started'); }
});
