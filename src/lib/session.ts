import { DAY, isDue } from './srs';
import type { Progress, Word } from '../types';

export interface Streak {
  last: string;
  count: number;
}

export function dueWords(words: Word[], progress: Progress, now: number): Word[] {
  return words.filter((w) => progress[w.id] && isDue(progress[w.id], now)).sort((a, b) => progress[a.id].due - progress[b.id].due);
}

export function topicSession(words: Word[], progress: Progress, now: number, limit: number): Word[] {
  const due = dueWords(words, progress, now);
  const fresh = words.filter((w) => !progress[w.id]);
  const rest = words.filter((w) => progress[w.id] && !isDue(progress[w.id], now)).sort((a, b) => progress[a.id].due - progress[b.id].due);
  return [...due, ...fresh, ...rest].slice(0, limit);
}

export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function updateStreak(prev: Streak | undefined, now: number): Streak {
  const today = dayKey(now);
  if (prev?.last === today) return prev;
  const yesterday = dayKey(new Date(now).setDate(new Date(now).getDate() - 1));
  return { last: today, count: prev?.last === yesterday ? prev.count + 1 : 1 };
}

export function currentStreak(streak: Streak | undefined, now: number): number {
  if (!streak) return 0;
  const yesterday = dayKey(new Date(now).setDate(new Date(now).getDate() - 1));
  return streak.last === dayKey(now) || streak.last === yesterday ? streak.count : 0;
}

export function formatInterval(ms: number): string {
  if (ms < DAY) return `${Math.max(1, Math.round(ms / 60000))}分钟`;
  const days = Math.round(ms / DAY);
  if (days < 30) return `${days}天`;
  return `${Math.round((days / 30) * 10) / 10}个月`;
}
