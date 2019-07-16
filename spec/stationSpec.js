'use strict';

var Station = require('../lib/station'),
    bogUtils = require('../lib/bog-utils'),
    parseBog = bogUtils.parseBog,
    BOG_FILE_ALL_PORTS = './spec/rc/testBogAllPorts.bog';

describe("Station", function () {

  describe("constructor", function () {
    let _home, _userHome;
    beforeEach(function () {
      _home = process.env.NIAGARA_HOME;
      _userHome = process.env.NIAGARA_USER_HOME;
    });

    afterEach(function () {
      process.env.NIAGARA_HOME = _home;
      process.env.NIAGARA_USER_HOME = _userHome;
    });

    it("accepts a config object", function () {
      var s = new Station({ test: 'hi' });
      expect(s.$config.test).toBe('hi');
    });

    it('uses given cwd when NIAGARA_HOME not present', function () {
      delete process.env.NIAGARA_HOME;
      let s = new Station({ cwd: 'testcwd' });
      expect(s.$config.cwd).toBe('testcwd');
    });

    it('uses given stationsDir when NIAGARA_USER_HOME not present', function () {
      delete process.env.NIAGARA_USER_HOME;
      let s = new Station({ stationsDir: 'testStationsDir' });
      expect(s.$config.stationsDir).toBe('testStationsDir');
    });
  });

  describe(".$applyBogOverrides() (private static)", function () {
    var bog;

    beforeEach(function (done) {
      parseBog(BOG_FILE_ALL_PORTS, function (err, b) {
        bog = b;
        done();
      });
    });

    it("applies httpPort override", function (done) {
      Station.$applyBogOverrides(bog, { httpPort: '4321' });

      var elem = bog.select('/Services/WebService/httpPort/publicServerPort');
      expect(elem.getAttribute('v')).toBe('4321');

      done();
    });

    it("applies httpsPort override", function (done) {
      Station.$applyBogOverrides(bog, { httpsPort: '4322' });

      var elem = bog.select('/Services/WebService/httpsPort/publicServerPort');
      expect(elem.getAttribute('v')).toBe('4322');

      done();
    });

    it("applies foxPort override", function (done) {
      Station.$applyBogOverrides(bog, { foxPort: '4323' });

      var elem = bog.select('/Services/FoxService/foxPort/publicServerPort');
      expect(elem.getAttribute('v')).toBe('4323');

      done();
    });

    it("applies foxsPort override", function (done) {
      Station.$applyBogOverrides(bog, { foxsPort: '4324' });

      var elem = bog.select('/Services/FoxService/foxsPort/publicServerPort');
      expect(elem.getAttribute('v')).toBe('4324');

      done();
    });

  });
});
