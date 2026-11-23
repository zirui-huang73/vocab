import type { CardState, Word } from '../types';

export type Rng = () => number;
export type QuestionKind = 'pic2word' | 'audio2pic' | 'spell';

export interface Question {
  kind: QuestionKind;
  word: Word;
  options: Word[];
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-'’.]/g, '');
}

function confusable(a: Word, b: Word): boolean {
  return a.id === b.id || normalize(a.en) === normalize(b.en) || a.zh === b.zh;
}

export function pickDistractors(word: Word, sameTopic: Word[], all: Word[], n: number, rng: Rng): Word[] {
  const picked: Word[] = [];
  const consider = (pool: Word[]) => {
    for (const c of shuffle(pool, rng)) {
      if (picked.length >= n) return;
      if (!confusable(c, word) && !picked.some((p) => confusable(p, c))) picked.push(c);
    }
  };
  consider(sameTopic);
  if (picked.length < n) consider(all.filter((x) => x.topicId !== word.topicId));
  return picked;
}

export function chooseKind(state: CardState | undefined, rng: Rng): QuestionKind {
  const kinds: QuestionKind[] = state && state.reps >= 2 ? ['pic2word', 'audio2pic', 'spell'] : ['pic2word', 'audio2pic'];
  return kinds[Math.min(kinds.length - 1, Math.floor(rng() * kinds.length))];
}

export function buildQuestion(
  word: Word,
  sameTopic: Word[],
  all: Word[],
  state: CardState | undefined,
  rng: Rng = Math.random,
): Question {
  let kind = chooseKind(state, rng);
  if (kind === 'spell') return { kind, word, options: [] };
  if (kind === 'audio2pic' && !word.image) kind = 'pic2word';
  const pictured = (ws: Word[]) => (kind === 'audio2pic' ? ws.filter((w) => w.image) : ws);
  const options = shuffle([word, ...pickDistractors(word, pictured(sameTopic), pictured(all), 3, rng)], rng);
  return { kind, word, options };
}

export function checkSpelling(input: string, word: Word): boolean {
  const n = normalize(input);
  return n.length > 0 && (n === normalize(word.en) || (word.uk !== undefined && n === normalize(word.uk)));
}

export function spellingHint(en: string): string {
  return en
    .split(/\s+/)
    .map((part) => [...part].map((ch, i) => (i === 0 || !/\p{L}/u.test(ch) ? ch : '_')).join(' '))
    .join('   ');
}
