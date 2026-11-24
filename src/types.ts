export type PartOfSpeech = 'verb' | 'adj';

export interface Word {
  id: string;
  topicId: string;
  en: string;
  uk?: string;
  pos?: PartOfSpeech;
  ipa: string;
  zh: string;
  example: string;
  image?: string;
  credit?: string;
}

export interface Topic {
  id: string;
  en: string;
  zh: string;
  icon: string;
  group: string;
  words: Word[];
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface CardState {
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  due: number;
}

export type Progress = Record<string, CardState>;
