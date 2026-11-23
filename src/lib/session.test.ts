import { describe, expect, it } from 'vitest';
import { dueWords, formatInterval, topicSession, updateStreak } from './session';
import { DAY } from './srs';
import type { CardState, Progress, Word } from '../types';

const now = new Date(2026, 10, 23, 9, 0).getTime();
const words: Word[] = ['a', 'b', 'c', 'd', 'e'].map((en) => ({ id: `t.${en}`, topicId: 't', en, ipa: '', zh: en, example: '' }));
const state = (due: number): CardState => ({ ease: 2.5, interval: 1, reps: 1, lapses: 0, due });

describe('dueWords', () => {
  it('returns learned words due today, oldest first', () => {
    const progress: Progress = { 't.a': state(now + 3 * DAY), 't.b': state(now - DAY), 't.c': state(now - 2 * DAY) };
    expect(dueWords(words, progress, now).map((w) => w.en)).toEqual(['c', 'b']);
  });
});

describe('topicSession', () => {
  it('puts due words first, then new words, then the rest, up to the limit', () => {
    const progress: Progress = { 't.a': state(now + 3 * DAY), 't.b': state(now - DAY), 't.d': state(now + DAY) };
    expect(topicSession(words, progress, now, 4).map((w) => w.en)).toEqual(['b', 'c', 'e', 'd']);
  });
});

describe('updateStreak', () => {
  it('starts at 1', () => {
    expect(updateStreak(undefined, now)).toEqual({ last: '2026-11-23', count: 1 });
  });
  it('does not change on the same day', () => {
    expect(updateStreak({ last: '2026-11-23', count: 4 }, now)).toEqual({ last: '2026-11-23', count: 4 });
  });
  it('increments on the next day', () => {
    expect(updateStreak({ last: '2026-11-22', count: 4 }, now)).toEqual({ last: '2026-11-23', count: 5 });
  });
  it('resets after a missed day', () => {
    expect(updateStreak({ last: '2026-11-20', count: 4 }, now)).toEqual({ last: '2026-11-23', count: 1 });
  });
});

describe('formatInterval', () => {
  it('formats minutes, days and months', () => {
    expect(formatInterval(10 * 60 * 1000)).toBe('10分钟');
    expect(formatInterval(3 * DAY)).toBe('3天');
    expect(formatInterval(45 * DAY)).toBe('1.5个月');
  });
});
