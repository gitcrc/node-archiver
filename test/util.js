/*global describe,it */
var fs = require('fs');
var assert = require('chai').assert;

var common = require('./helpers/common');
var adjustDateByOffset = common.adjustDateByOffset;
var binaryBuffer = common.binaryBuffer;
var BinaryStream = common.BinaryStream;
var DeadEndStream = common.DeadEndStream;

var ChecksumStream = require('../lib/util/ChecksumStream');
var DeflateRawChecksum = require('../lib/util/DeflateRawChecksum');
var crc32 = require('../lib/util/crc32');
var utils = require('../lib/util');

var testBuffer = binaryBuffer(20000);

var testDate = new Date('Jan 03 2013 14:26:38 GMT');
var testDateOctal = 12071312436;
var testDateDos = 1109607251;
var testDateDosUTC = 1109619539;

var testTimezoneOffset = testDate.getTimezoneOffset();

describe('utils', function() {

  describe('ChecksumStream', function() {
    it('should checksum data while transforming data', function(done) {
      var binary = new BinaryStream(20000);
      var checksum = new ChecksumStream();
      var deadend = new DeadEndStream();

      checksum.on('end', function() {
        assert.equal(checksum.digest, -270675091);

        done();
      });

      checksum.pipe(deadend);
      binary.pipe(checksum);
    });

    it('should calculate data size while transforming data', function(done) {
      var binary = new BinaryStream(20000);
      var checksum = new ChecksumStream();
      var deadend = new DeadEndStream();

      checksum.on('end', function() {
        assert.equal(checksum.rawSize, 20000);

        done();
      });

      checksum.pipe(deadend);
      binary.pipe(checksum);
    });
  });


  describe('crc32', function() {

    describe('CRC32', function() {

      describe('#update(data)', function() {
        it('should update crc32 based on data', function() {
          var actual = crc32.createCRC32().update('testing checksum');

          assert.equal(actual.crc, 323269802);
        });
      });

      describe('#digest()', function() {
        it('should return crc32 digest', function() {
          var actual = crc32.createCRC32().update('testing checksum').digest();

          assert.equal(actual, -323269803);
        });
      });

    });

    describe('createCRC32()', function() {
      it('should create new instance of CRC32', function() {
        assert.instanceOf(crc32.createCRC32(), crc32.CRC32);
      });
    });

  });


  describe('DeflateRawChecksum', function() {
    it('should checksum data while writing', function(done) {
      var deflate = new DeflateRawChecksum();

      deflate.on('end', function() {
        assert.equal(deflate.digest, -270675091);

        done();
      });

      deflate.write(testBuffer);
      deflate.end();
    });

    it('should calculate data size while writing', function(done) {
      var deflate = new DeflateRawChecksum();

      deflate.on('end', function() {
        assert.equal(deflate.rawSize, 20000);

        done();
      });

      deflate.write(testBuffer);
      deflate.end();
    });
  });


  describe('index', function() {

    describe('cleanBuffer(size)', function() {
      var actual = utils.cleanBuffer(5);

      it('should return new instance of Buffer', function() {
        assert.instanceOf(actual, Buffer);
      });

      it('should have a length of size', function() {
        assert.lengthOf(actual, 5);
      });

      it('should be an Buffer filled with zeros', function() {
        var actualArray = [];

        for (var i = 0; i < actual.length ; i++) {
          actualArray.push(actual[i]);
        }

        assert.deepEqual(actualArray, [0, 0, 0, 0, 0]);
      });
    });

    describe('convertDateTimeDos(input)', function() {
      it('should convert DOS input into Date instance', function() {
        var actual = adjustDateByOffset(utils.convertDateTimeDos(testDateDosUTC), testTimezoneOffset);

        assert.deepEqual(actual, testDate);
      });
    });

    describe('convertDateTimeOctal(input)', function() {
      it('should convert octal input into Date instance', function() {
        assert.deepEqual(utils.convertDateTimeOctal(testDateOctal), testDate);
      });
    });

    describe('dateify(dateish)', function() {
      it('should pass-through dateish Date', function() {
        assert.deepEqual(utils.dateify(testDate), testDate, 'Date');
      });

      it('should convert dateish string to Date', function() {
        assert.deepEqual(utils.dateify('Jan 03 2013 14:26:38 GMT'), testDate, 'date string');
      });

      it('should return new Date if not string or Date', function() {
        assert.instanceOf(utils.dateify(null), Date, 'empty');
      });
    });

    describe('defaults(object)', function() {
      it('should default when object key is missing', function() {
        var actual = utils.defaults({ value1: true }, {
          value2: true
        });

        assert.deepEqual(actual, {
          value1: true,
          value2: true
        });
      });

      it('should default when object key contains null value', function() {
        var actual = utils.defaults({ value1: null }, {
          value1: true,
          value2: true
        });

        assert.deepEqual(actual, {
          value1: true,
          value2: true
        });
      });
    });

    describe('dosDateTime(date, utc)', function() {
      it.skip('should convert date to DOS representation', function() {
        assert.deepEqual(utils.dosDateTime(testDate), testDateDos);
      });

      it('should convert date (forcing UTC) to DOS representation', function() {
        assert.equal(utils.dosDateTime(testDate, true), testDateDosUTC);
      });
    });

    describe('isStream(source)', function() {
      it('should return true if source is a stream', function() {
        assert.ok(utils.isStream(new DeadEndStream()));
      });
    });

    describe('octalDateTime(date)', function() {
      it('should convert date to octal representation', function() {
        assert.equal(utils.octalDateTime(testDate), testDateOctal);
      });
    });

    describe('padNumber(number, bytes, base)', function() {
      it('should pad number to specificed bytes', function() {
        assert.equal(utils.padNumber(0, 7), '0000000');
      });
    });

    describe('repeat(pattern, count)', function() {
      it('should repeat pattern by count', function() {
        assert.equal(utils.repeat('x', 4), 'xxxx');
      });
    });

    describe('sanitizeFilePath(filepath)', function() {
      it('should sanitize filepath', function() {
        assert.equal(utils.sanitizeFilePath('\\this/path//file.txt'), 'this/path/file.txt');
      });
    });

    describe('unixifyPath(filepath)', function() {
      it('should unixify filepath', function() {
        assert.equal(utils.unixifyPath('this\\path\\file.txt'), 'this/path/file.txt');
      });
    });

  });

});