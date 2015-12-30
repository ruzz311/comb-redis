var expect = require('expect');
var redis = require('../index');
var Promise = require('../utils/Promise');
var db = require('./db');
var comb = require('comb');

describe('monitor', function () {
  var monitor;
  beforeEach(function () {
    monitor = redis.createClient();
  });

  describe('when monitoring the database', function () {
    var monitorMessages, commands;
    beforeEach(function () {
      monitorMessages = [];
      commands = [
        [ 'set', 'a', '5' ],
        [ 'incrby', 'a', '6' ],
        [ 'get', 'a' ]
      ];

      monitor.on('monitor', function (time, args) {
        monitorMessages.push(args);
      });

      return monitor.monitor().chain(function (reply) {
        expect(reply).toEqual('OK');

        // Send all commands in order.
        var result = [];

        commands.forEach(function (command) {
          result.push(db.send(command[0], command.slice(1)));
        });

        return comb.chain(result).chain(waitForDelivery);
      });
    });

    it('receives a message for all commands in the order they are sent', function () {
      expect(monitorMessages.length).toEqual(commands.length);

      monitorMessages.forEach(function (args, index) {
        expect(args).toEqual(commands[index]);
      });
    });
  });
});

function waitForDelivery() {
  var p = new Promise();
  setTimeout(p.callback, 10);
  return p.promise();
}
