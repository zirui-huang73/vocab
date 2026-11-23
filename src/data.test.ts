import { describe, expect, it } from 'vitest';
import { GROUPS, allWords, rawTopics, topics } from './data';

describe('topic data', () => {
  it('has topics', () => {
    expect(topics.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(rawTopics))('%s is well formed', (path, t) => {
    expect(path.endsWith(`/${t.id}.json`)).toBe(true);
    expect(GROUPS.map((g) => g.id)).toContain(t.group);
    expect(t.en && t.zh && t.icon).toBeTruthy();
    expect(t.words.length).toBeGreaterThanOrEqual(8);
    for (const w of t.words) {
      const label = `${t.id}/${w.en}`;
      expect(w.en.trim(), label).toBe(w.en);
      expect(w.zh, label).toBeTruthy();
      expect(w.ipa, label).toMatch(/^\/.+\/$/);
      expect(w.example, label).toMatch(/[.?!]$/);
      const stem = w.en.toLowerCase().slice(0, Math.max(3, w.en.length - 2));
      expect(w.example.toLowerCase(), label).toContain(stem);
    }
  });

  it('has unique word ids', () => {
    const ids = allWords.map((w) => w.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('has unique topic ids and orders', () => {
    const raw = Object.values(rawTopics);
    expect(new Set(raw.map((t) => t.id)).size).toBe(raw.length);
    expect(new Set(raw.map((t) => t.order)).size).toBe(raw.length);
  });
});
