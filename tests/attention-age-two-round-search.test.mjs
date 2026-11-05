import assert from 'node:assert/strict';
import {BOARDS, compareRounds, scoreRound} from '../src/attention-age/focus-test-score-changes/two-round-search.mjs';

assert.equal(BOARDS.length, 2);
assert.equal(BOARDS[0].length, 5);
assert.equal(BOARDS[1].length, 5);
assert.equal(new Set(BOARDS[0]).size, 5);
assert.equal(new Set(BOARDS[1]).size, 5);
assert.ok(BOARDS.flat().every(index => Number.isInteger(index) && index >= 0 && index < 25));

assert.deepEqual(scoreRound(BOARDS[0], BOARDS[0]), {
  hits: 5, missed: 0, extraTaps: 0, selected: 5, targets: 5
});
assert.deepEqual(scoreRound(BOARDS[0], []), {
  hits: 0, missed: 5, extraTaps: 0, selected: 0, targets: 5
});
assert.deepEqual(scoreRound(BOARDS[0], [1, 7, 0, 2]), {
  hits: 2, missed: 3, extraTaps: 2, selected: 4, targets: 5
});
assert.deepEqual(scoreRound(BOARDS[0], [1, 1, 7]), {
  hits: 2, missed: 3, extraTaps: 0, selected: 2, targets: 5
});
assert.throws(() => scoreRound(BOARDS[0], [25]), RangeError);
assert.throws(() => scoreRound([-1], []), RangeError);

const first = scoreRound(BOARDS[0], [1, 7, 13, 0]);
const second = scoreRound(BOARDS[1], [3, 9, 11, 17, 22]);
assert.deepEqual(compareRounds(first, second), {
  hitDifference: 2,
  missedDifference: -2,
  extraTapDifference: -1
});

console.log('Attention Age two-round visual-search model: 13 checks passed.');
