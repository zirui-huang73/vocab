import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { schedule } from './lib/srs';
import { updateStreak, type Streak } from './lib/session';
import { setPreferredVoice } from './lib/speech';
import type { Progress, Rating } from './types';

export interface Settings {
  flashFront: 'image' | 'word';
  autoplay: boolean;
  voice?: string;
}

export interface SavedData {
  version: 1;
  progress: Progress;
  settings: Settings;
  streak?: Streak;
}

const KEY = 'learn-english:v1';
const DEFAULT_SETTINGS: Settings = { flashFront: 'image', autoplay: true };
const EMPTY: SavedData = { version: 1, progress: {}, settings: DEFAULT_SETTINGS };

interface Store extends SavedData {
  rate: (wordId: string, rating: Rating) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: SavedData) => void;
}

const Ctx = createContext<Store | null>(null);

export function parseSaved(raw: unknown): SavedData {
  const d = raw as Partial<SavedData> | undefined;
  if (!d || d.version !== 1 || typeof d.progress !== 'object' || d.progress === null) throw new Error('不是有效的进度文件');
  return { version: 1, progress: d.progress, settings: { ...DEFAULT_SETTINGS, ...d.settings }, streak: d.streak };
}

function load(): SavedData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseSaved(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SavedData>(load);

  useEffect(() => {
    void navigator.storage?.persist?.();
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => setPreferredVoice(data.settings.voice), [data.settings.voice]);

  const rate = useCallback(
    (wordId: string, rating: Rating) =>
      setData((d) => {
        const now = Date.now();
        return {
          ...d,
          progress: { ...d.progress, [wordId]: schedule(d.progress[wordId], rating, now) },
          streak: updateStreak(d.streak, now),
        };
      }),
    [],
  );
  const updateSettings = useCallback((patch: Partial<Settings>) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })), []);
  const replaceAll = useCallback((next: SavedData) => setData(next), []);

  return <Ctx.Provider value={{ ...data, rate, updateSettings, replaceAll }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
