'use strict';

var fs = require('fs'),
    bogUtils = require('../lib/bog-utils'),
    Bog = bogUtils.Bog,
    parseBog = bogUtils.parseBog,

    BOG_FILE_ALL_PORTS = './spec/rc/testBogAllPorts.bog',
    BOG_FILE_NO_FILE_XML = './spec/rc/no.file.xml.bog',
    BOG_FILE_MALFORMED = './spec/rc/malformed.bog',
    BOG_FILE_TO_WRITE = './spec/rc/written.bog';

describe("bog-utils", function () {
  describe(".parseBog() (static)", function () {
    it("decompresses a .bog file and returns a Bog object", function (done) {
      parseBog(BOG_FILE_ALL_PORTS, function (err, bog) {
        expect(bog).toEqual(jasmine.any(Bog));
        done();
      });
    });

    it("errors if file does not exist", function (done) {
      parseBog("nonexistent.xml", function (err) {
        expect(err).toBeDefined();
        done();
      });
    });

    it("errors if bog file does not contain file.xml", function (done) {
      parseBog(BOG_FILE_NO_FILE_XML, function (err) {
        expect(err).toBeDefined();
        done();
      });
    });

    it("errors if bog file is malformed", function (done) {
      parseBog(BOG_FILE_MALFORMED, function (err) {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe(".Bog", function () {
    var bog;
    beforeEach(function (done) {
      parseBog(BOG_FILE_ALL_PORTS, function (err, b) {
        bog = b;
        done();
      });
    });

    describe("#save()", function () {
      it("writes out to a .bog file", function (done) {
        bog.save(BOG_FILE_TO_WRITE, function (err) {
          expect(err).toBeNull();
          fs.exists(BOG_FILE_TO_WRITE, function (exists) {
            expect(exists).toBeTruthy();
            done();
          });
        });
      });

      it("produces a valid bog file", function (done) {
        bog.save(BOG_FILE_TO_WRITE, function (err) {
          expect(err).toBeNull();
          parseBog(BOG_FILE_TO_WRITE, function (err, bog) {
            expect(err).toBeNull();
            expect(bog).toEqual(jasmine.any(Bog));
            done();
          });
        });
      });
    });

    describe("#select()", function () {
      it("returns an Element instance", function () {
        expect(bog.select("/").parentNode).toBeDefined();
      });

      it("accepts a slot path from station root", function () {
        expect(bog.select("/Services").getAttribute('n'))
          .toBe('Services');

        expect(bog.select("/Drivers/NiagaraNetwork").getAttribute('n'))
          .toBe('NiagaraNetwork');

      });

      it("returns undefined if name is not found", function () {
        expect(bog.select('/Drivers/Whoops')).toBeUndefined();
      });
    });

    describe("#setValue", function () {
      it("returns an Element instance", function () {
        expect(bog.setValue("/").parentNode).toBeDefined();
      });

      it("accepts a slot path from station root", function () {
        expect(bog.setValue("/Services").getAttribute('n'))
          .toBe('Services');

        expect(bog.setValue("/Drivers/NiagaraNetwork").getAttribute('n'))
          .toBe('NiagaraNetwork');
      });

      it("returns undefined if non-final selector not found", function () {
        expect(bog.setValue('/Drivers/Whoops/createMe')).toBeUndefined();
      });

      it("appends final selector if it does not exist", function () {
        var nonExistentPath = '/Drivers/NiagaraNetwork/createMe';
        expect(bog.select(nonExistentPath)).toBeUndefined();
        expect(bog.setValue(nonExistentPath)).toBeDefined();
        expect(bog.select(nonExistentPath)).toBeDefined();
      });

      it("sets the second argument as the value", function () {
        var path = '/Drivers/NiagaraNetwork/newSlot';
        expect(bog.select(path)).toBeUndefined();

        var newElem = bog.setValue(path, 'newValue');
        expect(newElem.parentNode).toBe(bog.select('/Drivers/NiagaraNetwork'));
        expect(newElem.getAttribute('v')).toBe('newValue');
      });
    });
    
    describe('#addNode()', function () {
      it('adds a new node and returns it', function () {
        var path = '/Drivers/NiagaraNetwork',
            node = bog.addNode(path, 'newNode', 'b:Component');
        expect(node.getAttribute('n')).toBe('newNode');
        expect(node.getAttribute('t')).toBe('b:Component');
        expect(node.parentNode).toBe(bog.select(path));
      });
      
      it('just returns existing node if already exists', function () {
        var nnNode = bog.select('/Drivers/NiagaraNetwork'),
            newNode = bog.addNode('/Drivers', 'NiagaraNetwork', 'nd:NiagaraNetwork');
        expect(newNode).toBe(nnNode);
      });
      
      it('returns undefined if selector not found', function () {
        expect(bog.addNode('/Drivers/NiagaraNetwork/Whoops', 'newString', 'b:String'))
          .toBeUndefined();
      });
    });
  });
});