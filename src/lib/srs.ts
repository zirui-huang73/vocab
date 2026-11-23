import type { CardState, Rating } from '../types';

export const DAY = 24 * 60 * 60 * 1000;
const RELEARN_DELAY = 10 * 60 * 1000;
const MIN_EASE = 1.3;
const START_EASE = 2.5;

export function schedule(prev: CardState | undefined, rating: Rating, now: number): CardState {
  const s = prev ?? { ease: START_EASE, interval: 0, reps: 0, lapses: 0, due: now };

  if (rating === 'again') {
    return {
      ease: Math.max(MIN_EASE, s.ease - 0.2),
      interval: 0,
      reps: 0,
      lapses: s.lapses + 1,
      due: now + RELEARN_DELAY,
    };
  }

  const good = s.reps === 0 ? 1 : s.reps === 1 ? 3 : Math.round(s.interval * s.ease);
  let interval: number;
  let ease = s.ease;
  if (rating === 'hard') {
    interval = s.reps === 0 ? 1 : Math.max(s.interval + 1, Math.round(s.interval * 1.2));
    ease = Math.max(MIN_EASE, ease - 0.15);
  } else if (rating === 'easy') {
    interval = s.reps === 0 ? 4 : Math.round(good * 1.3);
    ease += 0.15;
  } else {
    interval = good;
  }

  return { ease, interval, reps: s.reps + 1, lapses: s.lapses, due: now + interval * DAY };
}

export function endOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function isDue(state: CardState, now: number): boolean {
  return state.due <= endOfDay(now);
}

export function isMastered(state: CardState): boolean {
  return state.interval >= 7;
}
