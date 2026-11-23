import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { allWords, topicById } from '../data';
import { dueWords, topicSession } from '../lib/session';
import { useStore } from '../store';
import BrowseSession from './BrowseSession';
import FlashSession from './FlashSession';
import QuizSession from './QuizSession';
import type { Word } from '../types';

const MODES = ['browse', 'flash', 'quiz'] as const;
type Mode = (typeof MODES)[number];
const LIMITS: Record<Mode, number> = { browse: Infinity, flash: 20, quiz: 10 };
const REVIEW_LIMIT = 50;

export interface SessionProps {
  words: Word[];
  title: string;
  back: string;
  onAgain?: () => void;
}

function Session({ mode, scope, onAgain }: { mode: Mode; scope: string; onAgain: () => void }) {
  const { progress } = useStore();
  const topic = topicById.get(scope);
  const [words] = useState(() => {
    const now = Date.now();
    if (!topic) return dueWords(allWords, progress, now).slice(0, REVIEW_LIMIT);
    if (mode === 'browse') return topic.words;
    return topicSession(topic.words, progress, now, LIMITS[mode]);
  });

  const props: SessionProps = {
    words,
    title: topic ? `${topic.icon} ${topic.zh}` : '每日复习',
    back: topic ? `/topic/${topic.id}` : '/',
    onAgain: topic ? onAgain : undefined,
  };
  if (mode === 'browse') return <BrowseSession {...props} />;
  if (mode === 'flash') return <FlashSession {...props} />;
  return <QuizSession {...props} />;
}

export default function Study() {
  const { mode = '', scope = '' } = useParams();
  const [round, setRound] = useState(0);
  const valid = (MODES as readonly string[]).includes(mode) && (scope === 'review' ? mode !== 'browse' : topicById.has(scope));
  if (!valid) return <Navigate to="/" replace />;
  return <Session key={`${mode}/${scope}/${round}`} mode={mode as Mode} scope={scope} onAgain={() => setRound((r) => r + 1)} />;
}
