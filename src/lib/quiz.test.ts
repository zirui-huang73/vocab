import { describe, expect, it } from 'vitest';
import { buildQuestion, checkSpelling, chooseKind, pickDistractors, spellingHint } from './quiz';
import type { Word } from '../types';

function w(topicId: string, en: string, extra: Partial<Word> = {}): Word {
  return { id: `${topicId}.${en}`, topicId, en, ipa: '', zh: en, example: '', image: `${en}.webp`, ...extra };
}

const fruit = ['apple', 'banana', 'cherry', 'grape', 'lemon', 'mango'].map((e) => w('fruit', e));
const car = ['hood', 'trunk', 'bumper'].map((e) => w('car', e));
const all = [...fruit, ...car];

function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('pickDistractors', () => {
  it('returns n distinct words from the same topic, excluding the answer', () => {
    const d = pickDistractors(fruit[0], fruit, all, 3, Math.random);
    expect(d).toHaveLength(3);
    expect(new Set(d.map((x) => x.id)).size).toBe(3);
    expect(d.every((x) => x.topicId === 'fruit' && x.id !== fruit[0].id)).toBe(true);
  });

  it('tops up from other topics when the topic is too small', () => {
    const small = car.slice(0, 2);
    const d = pickDistractors(small[0], small, all, 3, Math.random);
    expect(d).toHaveLength(3);
    expect(d.some((x) => x.topicId === 'car')).toBe(true);
    expect(d.some((x) => x.id === small[0].id)).toBe(false);
  });

  it('skips words that look identical to the answer', () => {
    const dupes = [w('a', 'sofa', { zh: '沙发' }), w('a', 'couch', { zh: '沙发' }), w('a', 'chair'), w('a', 'desk'), w('a', 'lamp')];
    for (let i = 0; i < 20; i++) {
      expect(pickDistractors(dupes[0], dupes, dupes, 3, Math.random).map((x) => x.en)).not.toContain('couch');
    }
  });
});

describe('chooseKind', () => {
  it('never asks for spelling on a new word', () => {
    for (const r of [0, 0.5, 0.99]) {
      expect(chooseKind(undefined, () => r)).not.toBe('spell');
    }
  });

  it('can ask for spelling once the word has been reviewed twice', () => {
    const state = { ease: 2.5, interval: 3, reps: 2, lapses: 0, due: 0 };
    const kinds = new Set([0, 0.4, 0.8, 0.99].map((r) => chooseKind(state, () => r)));
    expect(kinds.has('spell')).toBe(true);
  });
});

describe('buildQuestion', () => {
  it('builds 4 shuffled options containing the answer', () => {
    const q = buildQuestion(fruit[2], fruit, all, undefined, seq(0.1, 0.7, 0.3, 0.9, 0.5));
    expect(q.kind === 'pic2word' || q.kind === 'audio2pic').toBe(true);
    expect(q.options).toHaveLength(4);
    expect(q.options.map((o) => o.id)).toContain(fruit[2].id);
  });

  it('never asks audio-to-picture for a word without an image', () => {
    const noImg = w('fruit', 'stem', { image: undefined });
    for (const r of [0, 0.3, 0.6, 0.99]) {
      expect(buildQuestion(noImg, [...fruit, noImg], all, undefined, () => r).kind).toBe('pic2word');
    }
  });

  it('uses only pictured words as audio-to-picture options', () => {
    const noImg = w('fruit', 'stem', { image: undefined });
    const pool = [...fruit, noImg];
    for (let i = 0; i < 20; i++) {
      const q = buildQuestion(fruit[0], pool, all, undefined, () => 0.75);
      if (q.kind === 'audio2pic') expect(q.options.map((o) => o.id)).not.toContain(noImg.id);
    }
  });

  it('spelling questions have no options', () => {
    const q = buildQuestion(fruit[0], fruit, all, { ease: 2.5, interval: 3, reps: 2, lapses: 0, due: 0 }, () => 0.99);
    expect(q.kind).toBe('spell');
    expect(q.options).toEqual([]);
  });
});

describe('checkSpelling', () => {
  const word = w('car', 'trunk', { uk: 'boot' });
  it('ignores case and surrounding spaces', () => {
    expect(checkSpelling('  Trunk ', word)).toBe(true);
  });
  it('accepts the UK variant', () => {
    expect(checkSpelling('boot', word)).toBe(true);
  });
  it('treats hyphens and spaces the same', () => {
    expect(checkSpelling('rearview mirror', w('car', 'rear-view mirror'))).toBe(true);
    expect(checkSpelling('rear view  mirror', w('car', 'rear-view mirror'))).toBe(true);
  });
  it('rejects wrong spelling', () => {
    expect(checkSpelling('trunc', word)).toBe(false);
  });
});

describe('spellingHint', () => {
  it('shows first letter and keeps word boundaries', () => {
    expect(spellingHint('steering wheel')).toBe('s _ _ _ _ _ _ _   w _ _ _ _');
  });
});
