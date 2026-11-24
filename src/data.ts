import type { PartOfSpeech, Topic, Word } from './types';
import images from '../data/images.json';

export const POS_LABEL: Record<PartOfSpeech, string> = { verb: '动词', adj: '形容词' };

export interface RawWord {
  en: string;
  uk?: string;
  pos?: PartOfSpeech;
  ipa: string;
  zh: string;
  example: string;
  wiki?: string;
  img?: string;
  noimg?: boolean;
}

export interface RawTopic {
  id: string;
  order: number;
  en: string;
  zh: string;
  icon: string;
  group: string;
  words: RawWord[];
}

export const GROUPS = [
  { id: 'home', zh: '家居' },
  { id: 'food', zh: '食物' },
  { id: 'car', zh: '汽车出行' },
  { id: 'people', zh: '身体与穿戴' },
  { id: 'tools', zh: '工具文具' },
  { id: 'places', zh: '场所' },
  { id: 'other', zh: '其他' },
] as const;

export function slugify(en: string): string {
  return en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const rawTopics: Record<string, RawTopic> = import.meta.glob<RawTopic>('../data/topics/*.json', {
  eager: true,
  import: 'default',
});

const imageMap = images as Record<string, { file: string; credit: string }>;
const base = import.meta.env.BASE_URL;

export const topics: Topic[] = Object.values(rawTopics)
  .sort((a, b) => a.order - b.order)
  .map((t) => ({
    id: t.id,
    en: t.en,
    zh: t.zh,
    icon: t.icon,
    group: t.group,
    words: t.words.map((w): Word => {
      const id = `${t.id}.${slugify(w.en)}`;
      const img = imageMap[id];
      return {
        id,
        topicId: t.id,
        en: w.en,
        uk: w.uk,
        pos: w.pos,
        ipa: w.ipa,
        zh: w.zh,
        example: w.example,
        image: img ? `${base}images/${img.file}` : undefined,
        credit: img?.credit,
      };
    }),
  }));

export const allWords: Word[] = topics.flatMap((t) => t.words);
export const wordById = new Map(allWords.map((w) => [w.id, w]));
export const topicById = new Map(topics.map((t) => [t.id, t]));
