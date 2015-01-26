var expect = require('expect');
var redis = require('../index');
var Promise = require('../utils/Promise');
var comb = require('comb');
var db = require('./db');

describe('subscribe', function () {
  var subscriber;
  beforeEach(function () {
    subscriber = redis.createClient();
  });

  // Sends the given messages in order to the given channel.
  function sendMessages(channel, messages) {
    messages = messages.slice(0);

    var result = db.publish(channel, messages.shift());

    return messages.reduce(function (result, message) {
      return result.then(function () {
        return db.publish(channel, message);
      });
    }, result);
  }

  describe('when subscribing to a channel', function () {
    var receivedMessages, sentMessages;
    beforeEach(function () {
      receivedMessages = [];
      sentMessages = [ 'a', 'b', 'c' ];

      subscriber.on('message', function (channel, message) {
        receivedMessages.push(message);
      });

      return subscriber.subscribe('a').chain(function () {
        return sendMessages('a', sentMessages).chain(waitForDelivery);
      });
    });

    it('streams messages that are sent to that channel', function () {
      expect(receivedMessages).toEqual(sentMessages);
    });

    it('sets the pub_sub_mode-flag', function () {
      expect(subscriber.pub_sub_mode).toEqual(true);
    });
  });

  describe('when subscribing to many channels', function () {
    var aReceivedMessages, bReceivedMessages;
    var aSentMessages, bSentMessages;
    beforeEach(function () {
      aReceivedMessages = [];
      bReceivedMessages = [];
      aSentMessages = [ 'a', 'b', 'c' ];
      bSentMessages = [ 'd', 'e', 'f' ];

      subscriber.on('message', function (channel, message) {
        if (channel === 'a') aReceivedMessages.push(message);
        if (channel === 'b') bReceivedMessages.push(message);
      });

      return comb.when([
        subscriber.subscribe('a'),
        subscriber.subscribe('b')
      ]).chain(function () {
        return comb.when([
          sendMessages('a', aSentMessages),
          sendMessages('b', bSentMessages)
        ]).chain(waitForDelivery);
      });
    });

    it('streams messages that are sent to any of those channels', function () {
      expect(aReceivedMessages).toEqual(aSentMessages);
      expect(bReceivedMessages).toEqual(bSentMessages);
    });
  });
});

function waitForDelivery() {
  var p = new Promise();
  setTimeout(p.callback, 10);
  return p.promise();
}
