var expect = require('expect');
var comb = require('comb');
var db = require('./db');

describe('sunion', function () {
  beforeEach(function () {
    return comb.chain([
      db.sadd('set-one', 1, 2, 3, 4),
      db.sadd('set-two', 3, 4, 5, 6),
      db.sadd('set-three', 6, 7, 8)
    ]);
  });

  it('returns the members of the set resulting from the union of all given sets', function () {
    return db.sunion('set-one', 'set-two', 'set-three').chain(function (union) {
      expect(union.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });
});
