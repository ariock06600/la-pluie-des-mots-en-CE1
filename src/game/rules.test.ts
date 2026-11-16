import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LONG_ACCENTED_WORDS,
  LONG_PLAIN_WORDS,
  SHORT_ACCENTED_WORDS,
  SHORT_PLAIN_WORDS,
} from '../data/vocabulary';
import {
  applyCapitalization,
  calculateWordScore,
  getDifficultyParameters,
  getEncouragingFeedback,
  getWordPool,
  isPrintableGameKey,
  resolveKeyPress,
} from './rules';
import type { FallingWord } from './types';

test('vocabulary database contains at least 100 unique CE1 words with valid lengths and accent buckets', () => {
  const allWords = new Set([
    ...SHORT_PLAIN_WORDS,
    ...SHORT_ACCENTED_WORDS,
    ...LONG_PLAIN_WORDS,
    ...LONG_ACCENTED_WORDS,
  ]);
  assert.ok(allWords.size >= 100, `Expected >= 100 words, got ${allWords.size}`);

  for (const w of SHORT_PLAIN_WORDS) {
    assert.ok(w.length <= 5, `SHORT_PLAIN_WORDS word too long: ${w}`);
    assert.match(w, /^[a-z]+$/, `SHORT_PLAIN_WORDS word has non-plain chars: ${w}`);
  }

  for (const w of SHORT_ACCENTED_WORDS) {
    assert.ok(w.length <= 5, `SHORT_ACCENTED_WORDS word too long: ${w}`);
    assert.match(w, /[^a-z]/, `SHORT_ACCENTED_WORDS word missing accent/special: ${w}`);
  }

  for (const w of LONG_PLAIN_WORDS) {
    assert.ok(w.length <= 10, `LONG_PLAIN_WORDS word too long: ${w}`);
    assert.match(w, /^[a-z]+$/, `LONG_PLAIN_WORDS word has non-plain chars: ${w}`);
  }

  for (const w of LONG_ACCENTED_WORDS) {
    assert.ok(w.length <= 10, `LONG_ACCENTED_WORDS word too long: ${w}`);
    assert.match(w, /[^a-z]/, `LONG_ACCENTED_WORDS word missing accent/special: ${w}`);
  }
});

test('getWordPool respects difficulty level and special characters toggle', () => {
  const l1Plain = getWordPool({ level: 1, allowSpecialChars: false });
  assert.equal(l1Plain.length, 26);
  assert.ok(l1Plain.every((c) => c.length === 1 && /^[a-z]$/.test(c)));

  const l1Special = getWordPool({ level: 1, allowSpecialChars: true });
  assert.ok(l1Special.includes('é') && l1Special.includes("'") && l1Special.includes('-'));

  const l2Plain = getWordPool({ level: 2, allowSpecialChars: false });
  assert.ok(l2Plain.every((w) => w.length <= 5 && /^[a-z]+$/.test(w)));

  const l3Special = getWordPool({ level: 3, allowSpecialChars: true });
  assert.ok(l3Special.every((w) => w.length <= 10));
  assert.ok(l3Special.some((w) => w.includes('é') || w.includes('-')));
});

test('applyCapitalization capitalizes only when allowUppercase is true', () => {
  assert.equal(applyCapitalization('chat', 2, false, () => 0.1), 'chat');
  assert.equal(applyCapitalization('chat', 2, true, () => 0.1), 'Chat');
  assert.equal(applyCapitalization('é', 1, true, () => 0.1), 'É');
  assert.equal(applyCapitalization('-', 1, true, () => 0.1), '-');
});

test('isPrintableGameKey ignores dead keys and modifier keys', () => {
  assert.equal(isPrintableGameKey('Dead'), false);
  assert.equal(isPrintableGameKey('Shift'), false);
  assert.equal(isPrintableGameKey('Escape'), false);
  assert.equal(isPrintableGameKey('é'), true);
  assert.equal(isPrintableGameKey('A'), true);
  assert.equal(isPrintableGameKey("'"), true);
});

test('resolveKeyPress targets lowest matching word, tracks progress, and completes word', () => {
  const words: FallingWord[] = [
    { id: 1, text: 'chat', typedCount: 0, xPercent: 30, y: 80, speed: 40, variant: 0, shakeUntil: 0 },
    { id: 2, text: 'chien', typedCount: 0, xPercent: 70, y: 180, speed: 40, variant: 1, shakeUntil: 0 },
  ];

  // Typing 'c' should lock onto word 2 ('chien') because it is lower (y=180 > y=80)
  const step1 = resolveKeyPress('c', words, null, 1000);
  assert.equal(step1.outcome, 'hit');
  assert.equal(step1.newLockedWordId, 2);
  assert.equal(step1.updatedWords.find((w) => w.id === 2)?.typedCount, 1);

  // Typing wrong key while locked on 'chien' triggers miss and stays locked
  const miss = resolveKeyPress('x', step1.updatedWords, step1.newLockedWordId, 1100);
  assert.equal(miss.outcome, 'miss');
  assert.equal(miss.expectedChar, 'h');
  assert.equal(miss.newLockedWordId, 2);

  // Dead key is ignored without penalty
  const dead = resolveKeyPress('Dead', miss.updatedWords, miss.newLockedWordId, 1200);
  assert.equal(dead.outcome, 'ignored');

  // Complete 'chien'
  const s2 = resolveKeyPress('h', dead.updatedWords, 2, 1300);
  const s3 = resolveKeyPress('i', s2.updatedWords, 2, 1400);
  const s4 = resolveKeyPress('e', s3.updatedWords, 2, 1500);
  const s5 = resolveKeyPress('n', s4.updatedWords, 2, 1600);
  assert.equal(s5.outcome, 'completed');
  assert.equal(s5.newLockedWordId, null);
  assert.equal(s5.updatedWords.length, 1);
  assert.equal(s5.completedWord?.text, 'chien');
});

test('calculateWordScore awards more points when destroyed higher up on screen', () => {
  const highUp = calculateWordScore(5, 50, 600, 1);
  const lowDown = calculateWordScore(5, 500, 600, 1);
  assert.ok(highUp.total > lowDown.total);
  assert.ok(highUp.heightBonus > lowDown.heightBonus);
});

test('getDifficultyParameters ramps speed up and spawn interval down smoothly with score', () => {
  const start = getDifficultyParameters(2, 0);
  const later = getDifficultyParameters(2, 1500);
  assert.ok(later.fallSpeed > start.fallSpeed);
  assert.ok(later.spawnIntervalMs < start.spawnIntervalMs);
});

test('getEncouragingFeedback returns appropriate stars and French encouragement', () => {
  assert.equal(getEncouragingFeedback(50, 2).stars, 1);
  assert.equal(getEncouragingFeedback(400, 10).stars, 2);
  assert.equal(getEncouragingFeedback(900, 22).stars, 3);
});
