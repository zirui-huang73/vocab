import { describe, expect, it } from 'vitest';
import { DAY, isDue, isMastered, schedule } from './srs';
import type { CardState } from '../types';

const now = new Date(2026, 10, 23, 9, 0).getTime();

function run(ratings: Parameters<typeof schedule>[1][]): CardState {
  let s: CardState | undefined;
  let t = now;
  for (const r of ratings) {
    s = schedule(s, r, t);
    t = s.due;
  }
  return s!;
}

describe('schedule', () => {
  it('new card rated good is due in 1 day, then 3 days', () => {
    const first = schedule(undefined, 'good', now);
    expect(first.interval).toBe(1);
    expect(first.due).toBe(now + DAY);
    expect(first.reps).toBe(1);
    const second = schedule(first, 'good', first.due);
    expect(second.interval).toBe(3);
  });

  it('third good multiplies interval by ease', () => {
    const s = run(['good', 'good', 'good']);
    expect(s.interval).toBe(Math.round(3 * 2.5));
  });

  it('new card rated easy jumps to 4 days and raises ease', () => {
    const s = schedule(undefined, 'easy', now);
    expect(s.interval).toBe(4);
    expect(s.ease).toBeCloseTo(2.65);
  });

  it('again resets reps, lowers ease, and is due again soon', () => {
    const before = run(['good', 'good', 'good']);
    const s = schedule(before, 'again', now);
    expect(s.reps).toBe(0);
    expect(s.interval).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.ease).toBeCloseTo(before.ease - 0.2);
    expect(s.due - now).toBeLessThan(DAY);
  });

  it('ease never drops below 1.3', () => {
    const s = run(['again', 'again', 'again', 'again', 'again', 'again', 'again', 'again']);
    expect(s.ease).toBe(1.3);
  });

  it('hard grows the interval less than good', () => {
    const base = run(['good', 'good', 'good']);
    const hard = schedule(base, 'hard', base.due);
    const good = schedule(base, 'good', base.due);
    expect(hard.interval).toBeGreaterThan(base.interval);
    expect(hard.interval).toBeLessThan(good.interval);
  });

  it('easy grows the interval more than good', () => {
    const base = run(['good', 'good']);
    const easy = schedule(base, 'easy', base.due);
    const good = schedule(base, 'good', base.due);
    expect(easy.interval).toBeGreaterThan(good.interval);
  });
});

describe('isDue', () => {
  it('counts anything due before the end of today', () => {
    const tonight = new Date(2026, 10, 23, 22, 0).getTime();
    expect(isDue({ ease: 2.5, interval: 1, reps: 1, lapses: 0, due: tonight }, now)).toBe(true);
  });

  it('does not count tomorrow', () => {
    const tomorrow = new Date(2026, 10, 24, 1, 0).getTime();
    expect(isDue({ ease: 2.5, interval: 1, reps: 1, lapses: 0, due: tomorrow }, now)).toBe(false);
  });
});

describe('isMastered', () => {
  it('requires an interval of at least a week', () => {
    expect(isMastered(run(['good', 'good']))).toBe(false);
    expect(isMastered(run(['good', 'good', 'good']))).toBe(true);
  });
});
